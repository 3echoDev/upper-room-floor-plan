// Star PassPRNT Printer Integration
class StarPrinter {
    constructor() {
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    async printQRCode(tableId, qrCodeUrl) {
        if (!this.isIOS) {
            console.error('Printing is only supported on iOS devices');
            return;
        }

        try {
            // Get current time in Singapore timezone (SGT)
            const now = new Date();
            const options = {
                timeZone: 'Asia/Singapore',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            };
            const timeString = new Intl.DateTimeFormat('en-SG', options).format(now) + ' SGT';

            // Create the HTML content for printing
            const printHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            padding: 30px;
                            margin: 0;
                        }
                        .header {
                            font-size: 36px;
                            font-weight: bold;
                            margin-bottom: 20px;
                        }
                        .table-info {
                            font-size: 32px;
                            font-weight: bold;
                            margin-bottom: 20px;
                        }
                        .time {
                            font-size: 28px;
                            margin-bottom: 30px;
                        }
                        .scan-text {
                            font-size: 24px;
                            margin-bottom: 30px;
                        }
                        .qr-code {
                            max-width: 400px;
                            margin: 0 auto;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">The Upper Room</div>
                    <div class="table-info">Table: ${tableId}</div>
                    <div class="time">Time: ${timeString}</div>
                    <div class="scan-text">Scan QR code to order</div>
                    <div class="qr-code">
                        <img src="${qrCodeUrl}" alt="QR Code" style="width: 100%;">
                    </div>
                </body>
                </html>
            `;

            // Create the URI for Star PassPRNT app
            const uri = `starpassprnt://v1/print/nopreview?back=${encodeURIComponent(window.location.href)}&html=${encodeURIComponent(printHtml)}`;
            
            // Open Star PassPRNT app
            window.location.href = uri;
        } catch (error) {
            console.error('Error printing QR code:', error);
            throw error;
        }
    }
}

// Create global printer instance
window.starPrinter = new StarPrinter(); 