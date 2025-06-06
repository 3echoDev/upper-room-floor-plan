function generateQRCode(botUsername = "Angel_TUR_Waitress_Bot", tableNumber = 8) {
  const BOT_USERNAME = botUsername;
  const TABLE_NUMBER = tableNumber;

  // Create SG-time version of timestamp
  const sgOffset = 8 * 60 * 60 * 1000;
  const now = new Date(Date.now() + sgOffset); // Add 8 hours to UTC
  const pad = (n) => String(n).padStart(2, '0');

  const year = now.getUTCFullYear();
  const month = pad(now.getUTCMonth() + 1);
  const day = pad(now.getUTCDate());
  const hour = pad(now.getUTCHours());
  const minute = pad(now.getUTCMinutes());
  const second = pad(now.getUTCSeconds());

  const timestamp_str = `${year}-${month}-${day}_${hour}-${minute}-${second}`;
  const payload = `table${TABLE_NUMBER}_${timestamp_str}`;
  const deep_link_url = `https://t.me/${BOT_USERNAME}?start=${payload}`;
  const filename = `qr_table${TABLE_NUMBER}_${timestamp_str}.png`;

  if (typeof window !== 'undefined') {
    QRCode.toCanvas(document.getElementById('qrcode-canvas'), deep_link_url, function(error) {
      if (error) console.error(error);
      console.log(`✅ QR code displayed on canvas`);
      console.log(`🔗 Deep link: ${deep_link_url}`);
    });

    const downloadLink = document.getElementById('download-link');
    if (downloadLink) {
      QRCode.toDataURL(deep_link_url, function(err, url) {
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.style.display = 'block';
      });
    }
  } else {
    const fs = require('fs');
    QRCode.toFile(filename, deep_link_url, function(error) {
      if (error) throw error;
      console.log(`✅ QR code saved as: ${filename}`);
      console.log(`🔗 Deep link: ${deep_link_url}`);
    });
  }

  return { filename, deep_link_url };
}
