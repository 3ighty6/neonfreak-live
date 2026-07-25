import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import http from 'http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
const distPath = path.join(__dirname, 'dist')

const server = http.createServer((req, res) => {
  let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url)
  
  if (!filePath.startsWith(distPath)) {
    filePath = path.join(distPath, 'index.html')
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      fs.readFile(path.join(distPath, 'index.html'), (err, content) => {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(content)
      })
    } else {
      const ext = path.extname(filePath)
      let contentType = 'text/html'
      if (ext === '.js') contentType = 'application/javascript'
      if (ext === '.css') contentType = 'text/css'
      if (ext === '.json') contentType = 'application/json'
      if (ext === '.svg') contentType = 'image/svg+xml'
      if (ext === '.png') contentType = 'image/png'
      if (ext === '.jpg') contentType = 'image/jpeg'

      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content)
    }
  })
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
