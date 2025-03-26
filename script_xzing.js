function isMobileDevice() {
    return /Android|mobile|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

if (isMobileDevice()) {
    document.getElementById('centerpage').style.marginTop = '230px';
    document.getElementById('expiration-date').style.marginTop = '5px';

    document.getElementById('popupScanning').style.width = '90%';
    // document.getElementById('expiration-date').style.paddingLeft = '20px';
    // document.getElementById('expiration-date').style.paddingRight = '20px';
}


// Data management
let items = [];
let itemsofitems = [];
let stream = null;

// DOM elements
const elements = {
    startScanBtn: document.getElementById('startScan'),
    closeScanBtn: document.getElementById('closePopupScanner'),
    downloadBtn: document.getElementById('downloadList'),
    downloadXlsxBtn: document.getElementById('download-xlsx-btn'),
    clearBtn: document.getElementById('clearList'),
    manualInput: document.getElementById('manualInput'),
    quantityInput: document.getElementById('quantityInput'),
    addManualBtn: document.getElementById('addManual'),
    checkDuplicates: document.getElementById('checkDuplicates'),
    tableBody: document.getElementById('barcode-table-body'),

    fileName: document.getElementById('FileName'),
    // savefilelist: document.getElementById('Save-to-List-btn'),
    // savefilelist: document.getElementById('Exp-List-btn'),

};

const savefilelist = document.getElementById('Save-to-List-btn');
const expAllFile = document.getElementById('Exp-List-btn');

// Check if DOM elements exist
for (const [key, value] of Object.entries(elements)) {
    if (!value) console.warn(`Element ${key} not found in DOM`);
}

// Event listeners
elements.startScanBtn?.addEventListener('click', openScanner);
elements.closeScanBtn?.addEventListener('click', closeScanner);
elements.downloadBtn?.addEventListener('click', downloadTxt);
elements.downloadXlsxBtn?.addEventListener('click', downloadXlsx);
elements.clearBtn?.addEventListener('click', clearItems);
elements.addManualBtn?.addEventListener('click', addManual);
savefilelist.addEventListener('click', addNewGroup);
expAllFile.addEventListener('click', ExpAllFileAdded);

// Input enhancements
elements.manualInput?.addEventListener('focus', () => elements.manualInput?.select());
elements.manualInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addManual();
});

function addManual() {
    const code = elements.manualInput?.value.trim();
    const quantity = elements.quantityInput?.value.trim();

    if (!code || !quantity || isNaN(quantity) || Number(quantity) <= 0) {
        alert("Vui lòng nhập mã barcode và số lượng hợp lệ!");
        return;
    }

    if (elements.checkDuplicates?.checked && items.some(item => item.barcode === code)) {
        alert("Mã hàng đã tồn tại!");
        return;
    }

    items.push({ barcode: code, quantity: Number(quantity) });
    updateBarcodeList();
    elements.manualInput.value = '';
    elements.quantityInput.value = '';
    elements.manualInput?.focus();
}

function updateBarcodeList() {
    if (!elements.tableBody) return;
    elements.tableBody.innerHTML = '';
    
    items.forEach((item, index) => {           
        const tr = document.createElement('tr');
        tr.innerHTML = `
            ${!isMobileDevice() 
                ? `<td>${index + 1}</td>`
                : `<td class="stt_${index + 1}"><i class="delete fa-solid fa-trash" data-index="${index}" style="color: red;"></i> ${index + 1}</td>`
            }
            <td>${item.barcode}</td>
            <td class="Row_${index + 1}" data-index="${index}">${item.quantity}</td>
            ${!isMobileDevice() 
                ? `<td><button class="delete" data-index="${index}">Xóa</button></td>`
                : ''
            }
        `;
        elements.tableBody.appendChild(tr);
    });

    elements.tableBody.querySelectorAll('button.delete').forEach(button => {
        button.addEventListener('click', (e) => deleteItem(e.target.dataset.index));
    });

    elements.tableBody.querySelectorAll('i.delete').forEach(button => {
        button.addEventListener('click', (e) => deleteItem(e.target.dataset.index));
    });

    elements.tableBody.querySelectorAll('td[data-index]').forEach(cell => {
        cell.addEventListener('click', (e) => editQty(e.target.dataset.index));
    });
}

function deleteItem(index) {
    index = Number(index);
    if (confirm(`Bạn muốn xóa STT: ${index + 1} - mã hàng: ${items[index].barcode} ???`)) {
        items.splice(index, 1);
        updateBarcodeList();
    }
}

function editQty(index) {
    index = Number(index);
    const newQty = prompt("Nhập số lượng mới:", items[index].quantity);
    if (newQty === null) return;
    if (isNaN(newQty) || Number(newQty) <= 0) {
        alert("Số lượng phải là số dương!");
        return;
    }
    items[index].quantity = Number(newQty);
    updateBarcodeList();
}

function clearItems() {
    if (items.length === 0) {
        alert("Danh sách đã trống!");
        return;
    }
    if (confirm("Xóa toàn bộ danh sách?")) {
        items = [];
        updateBarcodeList();
    }
}

function downloadTxt() {
    if (items.length === 0) {
        alert("Danh sách trống!");
        return;
    }
    const text = items.map(item => `${item.barcode},${item.quantity}`).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    // link.download = `sku_${new Date().toISOString().slice(0,10)}.txt`;
    link.download = 'sku.txt';
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function downloadXlsx() {
    if (items.length === 0) {
        alert("Danh sách trống!");
        return;
    }
    if (typeof XLSX === 'undefined') {
        alert("Thư viện XLSX chưa được tải!");
        return;
    }
    const data = items.map((item, index) => ({
        STT: index + 1,
        'Mã hàng': item.barcode,
        'Tên hàng': '',
        'Số lượng': item.quantity,
        'Đơn vị': 'Cái',
        'Đơn giá': 0
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách');
    // XLSX.writeFile(wb, `sku_${new Date().toISOString().slice(0,10)}.xlsx`);
    XLSX.writeFile(wb, `sku.xlsx`);
}

function openScanner() {
    const popup = document.getElementById('popupScanning');
    const video = document.getElementById('video');
    if (!popup || !video) {
        alert("Không tìm thấy phần tử quét!");
        return;
    }
    
    popup.classList.remove('hidden');
    
    navigator.mediaDevices.getUserMedia({
        video: { facingMode: isMobileDevice() ? 'environment' : 'user' }
    }).then(mediaStream => {
        stream = mediaStream;
        video.srcObject = stream;
        video.play();
        startZXing(video); // Thay startQuagga bằng startZXing
    }).catch(err => {
        console.error("Camera access error:", err);
        alert("Không thể truy cập camera: " + err.message);
        closeScanner();
    });
}

function startZXing(video) {
    if (typeof ZXing === 'undefined') {
        alert("Thư viện ZXing chưa được tải!");
        closeScanner();
        return;
    }

    const codeReader = new ZXing.BrowserMultiFormatReader();
    codeReader.decodeFromVideoDevice(null, video, (result, err) => {
        if (result) {
            const code = result.getText();
            // Sửa cách lấy định dạng barcode
            const formatEnum = result.getBarcodeFormat(); // Lấy enum BarcodeFormat
            const format = ZXing.BarcodeFormat[formatEnum].toLowerCase(); // Chuyển enum thành chuỗi và lowercase
            const validFormats = ["code_128", "ean_13", "upc_a"];

            if (code && validFormats.includes(format)) {
                const checkDuplicates = elements.checkDuplicates?.checked;
                const existingIndex = items.findIndex(item => item.barcode === code);

                if (checkDuplicates && existingIndex !== -1) {
                    alert(`TRÙNG MÃ, mã: ${code}; đã có trong danh sách.`);
                    // closeScanner();
                } else {
                    const quantity = prompt(`Nhập số lượng cho mã ${code}:`, "");
                    if (quantity === null) return;
                    if (isNaN(quantity) || Number(quantity) <= 0) {
                        alert("Số lượng phải là số dương!");
                    } else {
                        items.push({ barcode: code, quantity: Number(quantity) });
                        updateBarcodeList();
                        closeScanner();
                        openScanner();
                    }
                }
            } else if (code) {
                alert(`Định dạng barcode không hợp lệ: ${format}`);
            }
            codeReader.reset(); // Dừng quét
        }
        if (err && !(err instanceof ZXing.NotFoundException)) {
            console.error("ZXing error:", err);
        }
    }).catch(err => {
        console.error("ZXing init error:", err);
        alert("Lỗi khởi động quét: " + err.message);
        closeScanner();
    });
}

function closeScanner() {
    const popup = document.getElementById('popupScanning');
    const video = document.getElementById('video');

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    if (video) video.srcObject = null;
    if (typeof codeReader !== 'undefined') codeReader.reset(); // Dừng ZXing nếu đang chạy
    if (popup) popup.classList.add('hidden');
}



// function closeScanner() {
//     const popup = document.getElementById('popupScanning');
//     const video = document.getElementById('video');

//     if (stream) {
//         stream.getTracks().forEach(track => track.stop());
//         stream = null;
//     }
//     if (video) video.srcObject = null;
//     if (typeof Quagga !== 'undefined') Quagga.stop();
//     if (popup) popup.classList.add('hidden');
// }

function addNewGroup() {
    const newFile1 = elements.fileName.value.trim(); // Ensure fileName is defined
    if (!newFile1)
    {
        newFile1 = `A${String(itemsofitems.length + 1)}`;
    }

    itemsofitems.push({ tenfile: newFile1, noidungfile: [...items] }); // Use spread operator to copy items
    console.log(itemsofitems)
    elements.fileName.value= '';
    items = [];
    updateBarcodeList();
}


function ExpAllFileAdded() {
    const zip = new JSZip();

    // Iterate over each group in itemsofitems
    itemsofitems.forEach(group => {
        const fileContent = group.noidungfile.map(item => `${item.barcode},${item.quantity}`).join('\n');
        zip.file(`${group.tenfile}.txt`, fileContent); // Create a text file for each group
    });

    // Generate the zip file and trigger download
    zip.generateAsync({ type: "blob" })
        .then(function(content) {
            const url = window.URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = "SkuFiles.zip";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        })
        .catch(function(err) {
            console.error("Loi tao file ZIP:", err);
        });
}
