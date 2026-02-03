const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputPath = path.join(__dirname, '..', 'imagens', 'uniso-universidade-de-sorocaba.webp');
const outputDir = path.join(__dirname, '..', 'public', 'icons');

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('Gerando ícones PWA...');
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Gerado: icon-${size}x${size}.png`);
  }
  
  // Gerar também apple-touch-icon (180x180)
  await sharp(inputPath)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'));
  
  console.log('✓ Gerado: apple-touch-icon.png');
  
  // Gerar favicon.ico (32x32)
  await sharp(inputPath)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(path.join(outputDir, 'favicon-32x32.png'));
  
  console.log('✓ Gerado: favicon-32x32.png');
  
  console.log('\n✅ Todos os ícones foram gerados com sucesso!');
}

generateIcons().catch(console.error);
