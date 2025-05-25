const test = require('ava')
const {inspect} = require('node:util')

const {
  OutputManager
} = require('../src/common')


test('output manager', t => {
  const output = new OutputManager()

  output.add('abc')

  t.is(inspect(output), 'abc')

  t.true(output.includes('abc'))
  t.false(output.includes('abc'))

  output.close()

  output.add('abc')

  t.false(output.includes('abc'))
})
