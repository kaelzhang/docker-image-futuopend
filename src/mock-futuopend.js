#!/usr/bin/env node
const readline = require('readline')

const count = parseInt(process.env.FUTU_RETRY || 0, 10)

// Parse command line arguments
const args = process.argv.slice(2)
const config = {}

args.forEach(arg => {
  const [key, value] = arg.replace('-', '').split('=')
  config[key] = value
})

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const ask = () => {
  rl.question('>', (input) => {
    const trimmed = input.trim()

    // Check if it's a verification code input
    if (trimmed.startsWith('input_phone_verify_code -code=')) {
      const code = trimmed.split('=')[1]

      // Simulate processing delay
      setTimeout(() => {
        console.log('Login successful [from mock-futuopend]')

        // Close readline after successful login
        rl.close()

        // Hang for 60 seconds
        setTimeout(() => {}, 60 * 1000)
      }, 100)

      return
    }

    // Ask for code again
    ask()
  })
}

// Simulate startup delay then request verification code
setTimeout(() => {
  console.log('req_phone_verify_code [from mock-futuopend]')
  ask()
}, 100)

// Simulate exit if count is less than 2
if (count < 2) {
  setTimeout(() => {
    rl.close()
    process.exit(3)
  }, 1200)
}


// // Handle process termination
// process.on('SIGTERM', () => {
//   rl.close()
//   process.exit(0)
// })

// process.on('SIGINT', () => {
//   rl.close()
//   process.exit(0)
// })
