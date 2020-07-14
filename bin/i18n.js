'use strict'
const i18n = require('i18n')
const Language = {}

i18n.configure({
  locales: ['en', 'cn'],
  staticCatalog: {
    en: require('../language/en.json'),
    cn: require('../language/cn.json')
  },
  defaultLocale: 'en',
  register: Language
})

module.exports = Language
