const QRCode = require('qrcode');
const Jimp = require('jimp');

async function generateQRWithLogo(url, outputPath) {
    const qrBuffer = await QRCode.toBuffer(url, {
        errorCorrectionLevel: 'H', // High — нужно для вставки изображения
        type: 'png',
        width: 600,
    });

    const qrImage = await Jimp.read(qrBuffer);
    const logo = await Jimp.read('./marker.png'); // Твой маркер-логотип
    const logoSize = 120; // Размер логотипа в центре

    logo.resize(logoSize, logoSize);

    const x = (qrImage.bitmap.width / 2) - (logoSize / 2);
    const y = (qrImage.bitmap.height / 2) - (logoSize / 2);

    qrImage.composite(logo, x, y);

    await qrImage.writeAsync(outputPath);
    console.log(`QR saved to ${outputPath}`);
}

// Пример использования
generateQRWithLogo('https://genderparty.duckdns.org/ar?code=abc123', 'qr_with_marker.png');
