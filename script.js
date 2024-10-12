const fileInput = document.getElementById("file-input");
const dropArea = document.getElementById("drop-area");
const preview = document.getElementById("preview");
const resizeBtn = document.getElementById("resize-btn");
const resetBtn = document.getElementById("reset-btn");
let selectedFiles = [];
const MAX_FILES = 100; // 最大100枚の制限

resizeBtn.disabled = true;
resetBtn.classList.add("hidden");

dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropArea.style.borderColor = "blue";
});

dropArea.addEventListener("dragleave", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropArea.style.borderColor = "#ccc";
});

dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropArea.style.borderColor = "#ccc";

  // ドロップされたファイルを直接取得
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener("change", (e) => {
  handleFiles(e.target.files);
});

// 領域をクリックするとファイル選択ダイアログを開く
dropArea.addEventListener("click", () => {
  fileInput.click();
});

// ファイルやフォルダのアイテムを処理
function handleFiles(files) {
  selectedFiles = [];
  preview.innerHTML = "";

  const fileArray = Array.from(files).filter((file) =>
    file.type.startsWith("image/")
  );

  // ファイル数の制限
  if (fileArray.length > MAX_FILES) {
    alert(`最大 ${MAX_FILES} 枚の画像をアップロードできます。`);
    return;
  }

  // すべてのファイルを処理
  fileArray.forEach((file) => {
    selectedFiles.push(file);
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    preview.appendChild(img);
  });

  resizeBtn.disabled = selectedFiles.length === 0;

  if (selectedFiles.length > 0) {
    resetBtn.classList.remove("hidden");
  }
}

// リセットボタンのクリックイベント
resetBtn.addEventListener("click", () => {
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
  const backgroundColor = "#ffffff"; // 背景色を設定

  const zip = new JSZip();
  let processedImages = 0;

  selectedFiles.forEach((file) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.src = event.target.result;
      img.onload = function () {
        const imgAspectRatio = img.width / img.height;
        const canvasAspectRatio = width / height;

        // キャンバスの作成
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // 背景色を塗りつぶす
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        let renderWidth, renderHeight;
        let offsetX = 0,
          offsetY = 0;

        // 画像のアスペクト比に応じて描画サイズを調整
        if (imgAspectRatio > canvasAspectRatio) {
          // 画像が横長
          renderWidth = width;
          renderHeight = width / imgAspectRatio;
          offsetY = (height - renderHeight) / 2; // 上下に余白を均等に配置
        } else {
          // 画像が縦長
          renderWidth = height * imgAspectRatio;
          renderHeight = height;
          offsetX = (width - renderWidth) / 2; // 左右に余白を均等に配置
        }

        // 画像を中央に描画
        ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);

        // アップロードされた画像が1枚なら直接ダウンロード、複数ならZIP
        canvas.toBlob(function (blob) {
          if (selectedFiles.length === 1) {
            // 1枚なら直接ダウンロード
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `resized-${file.name}`;
            link.click();
          } else {
            // 複数ならZIPに追加
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
          }
        }, "image/jpeg");
      };
    };
    reader.readAsDataURL(file);
  });
});
