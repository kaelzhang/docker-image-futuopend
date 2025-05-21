const withResolvers = require('promise.withresolvers')

if (typeof Promise.withResolvers !== 'function') {
  Promise.withResolvers = () => withResolvers(Promise)
}
