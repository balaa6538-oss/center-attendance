const video = document.getElementById("video");
const result = document.getElementById("result");
const startBtn = document.getElementById("startBtn");

let stream = null;

startBtn.addEventListener("click", openScanner);

async function openScanner() {
  result.innerHTML = "📷 جاري فتح الكاميرا...";

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    result.innerHTML = "✅ الكاميرا اشتغلت.. وجّهها على QR";
    scanQR();
  } catch (e) {
    result.innerHTML = "❌ لم يتم السماح بالكاميرا أو المتصفح منعها";
  }
}

function scanQR() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const loop = () => {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code) {
        result.innerHTML = `✅ تم قراءة QR:<br><b>${code.data}</b>`;
        if (stream) stream.getTracks().forEach(t => t.stop());
        return;
      }
    }
    requestAnimationFrame(loop);
  };

  loop();
}
