let video = document.getElementById("video");

function openScanner() {
  document.getElementById("result").innerHTML = "📷 افتح الكاميرا ووجّهها على QR";

  navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  })
  .then(stream => {
    video.srcObject = stream;
    video.setAttribute("playsinline", true);
    video.play();
    scanQR();
  })
  .catch(() => {
    document.getElementById("result").innerHTML = "❌ لم يتم السماح بالكاميرا";
  });
}

function scanQR() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
      document.getElementById("result").innerHTML =
        "✅ تم قراءة QR:<br><b>" + code.data + "</b>";

      video.srcObject.getTracks().forEach(track => track.stop());
      return;
    }
  }

  requestAnimationFrame(scanQR);
}
