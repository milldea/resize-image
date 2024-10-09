const fileInput = document.getElementById("file-input");
const dropArea = document.getElementById("drop-area");
const preview = document.getElementById("preview");
const resizeBtn = document.getElementById("resize-btn");
const resetBtn = document.getElementById("reset-btn");
let selectedFiles = [];

resizeBtn.disabled = true;
resetBtn.classList.add("hidden");

dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.style.borderColor = "blue";
});

dropArea.addEventListener("dragleave", () => {
  dropArea.style.borderColor = "#ccc";
});

dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.style.borderColor = "#ccc";

  // ドロップされたアイテムを処理
  handleDrop(e.dataTransfer.items);
});

fileInput.addEventListener("change", (e) => {
  handleFiles(e.target.files);
});

// 領域をクリックするとファイル選択ダイアログを開く
dropArea.addEventListener("click", () => {
  fileInput.click();
});

// ドロップされたアイテムを処理
function handleDrop(items) {
  selectedFiles = [];
  preview.innerHTML = "";

  for (let item of items) {
    if (item.kind === "file") {
      const entry = item.webkitGetAsEntry(); // フォルダやファイルを取得
      if (entry) {
        if (entry.isFile) {
          entry.file((file) => handleFile(file)); // ファイルを処理
        } else if (entry.isDirectory) {
          readDirectory(entry); // フォルダを処理
        }
      }
    }
  }
}

function readDirectory(directory) {
  const reader = directory.createReader();
  reader.readEntries((entries) => {
    for (let entry of entries) {
      if (entry.isFile) {
        entry.file((file) => handleFile(file));
      } else if (entry.isDirectory) {
        readDirectory(entry); // サブフォルダの処理
      }
    }
  });
}

// ファイルを処理し、プレビューに表示
function handleFile(file) {
  if (file.type.startsWith("image/")) {
    selectedFiles.push(file);
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    preview.appendChild(img);
  }

  // 画像が選択された場合にボタンを有効化
  resizeBtn.disabled = selectedFiles.length === 0;

  // リセットボタンを表示
  if (selectedFiles.length > 0) {
    resetBtn.classList.remove("hidden");
  }
}

// handleFiles 関数の追加
function handleFiles(files) {
  selectedFiles = [];
  preview.innerHTML = "";

  Array.from(files).forEach((file) => {
    if (file.type.startsWith("image/")) {
      selectedFiles.push(file);
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      preview.appendChild(img);
    }
  });

  // 画像が選択された場合にボタンを有効化
  resizeBtn.disabled = selectedFiles.length === 0;

  // リセットボタンを表示
  if (selectedFiles.length > 0) {
    resetBtn.classList.remove("hidden");
  }
}

// リセットボタンのクリックイベント
resetBtn.addEventListener("click", () => {
  // 選択されたファイルとプレビューをリセット
  selectedFiles = [];
  preview.innerHTML = "";
  fileInput.value = "";

  resizeBtn.disabled = true;
  resetBtn.classList.add("hidden");
});

// リサイズとダウンロードの処理
resizeBtn.addEventListener("click", () => {
  const width = parseInt(document.getElementById("width").value);
  const height = parseInt(document.getElementById("height").value);

  const zip = new JSZip();
  let processedImages = 0;

  selectedFiles.forEach((file) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.src = event.target.result;
      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(function (blob) {
          zip.file(`resized-${file.name}`, blob);
          processedImages++;

          if (processedImages === selectedFiles.length) {
            zip.generateAsync({ type: "blob" }).then(function (content) {
              const link = document.createElement("a");
              link.href = URL.createObjectURL(content);
              link.download = "resized-images.zip";
              link.click();
            });
          }
        }, "image/jpeg");
      };
    };
    reader.readAsDataURL(file);
  });
});
