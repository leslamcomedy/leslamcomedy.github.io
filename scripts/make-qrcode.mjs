import QRCode from 'qrcode'

await QRCode.toFile('网站二维码.png', 'https://fanyu-meng.github.io/leSlamComedy_KnowledgeBase/', {
  width: 600,
  margin: 2,
  color: { dark: '#000000', light: '#FFD500' },
})
console.log('二维码已生成')
