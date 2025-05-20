#!/usr/bin/env node

const fs = require('node:fs')
const {join} = require('node:path')

const store_path = join(__dirname, 'futuopend.json')

let store = {}

try {
  store = JSON.parse(fs.readFileSync(store_path, 'utf-8'))
} catch (error) {
  // do nothing
}

const {
  count = 0
} = store

store.count = count + 1

fs.writeFileSync(store_path, JSON.stringify(store, null, 2))

// Parse command line arguments
const args = process.argv.slice(2)
const config = {}

args.forEach(arg => {
  const [key, value] = arg.replace('-', '').split('=')
  config[key] = value
})

// Simulate startup delay
setTimeout(() => {
  // Output the verification code request message
  console.log('req_phone_verify_code')

  // Listen for input from pty
  process.stdin.on('data', (data) => {
    const input = data.toString().trim()

    // Check if it's a verification code input
    if (input.startsWith('input_phone_verify_code -code=')) {
      const code = input.split('=')[1]

      // Simulate processing delay
      setTimeout(() => {
        // Output login success message
        console.log('Login successful')
      }, 500)
    }
  })
}, 500)

if (count < 2) {
  setTimeout(() => {
    process.exit(3)
  }, 1200)
}
