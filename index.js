const postcss = require('postcss')
const path = require('path')
const map = require('multi-stage-sourcemap')

function processPlugin (plugin) {
  // If plugin is a string, require the package that we assume it points to
  if (typeof plugin === 'string') {
    return require(plugin)()
  }

  return plugin
}

module.exports = function (plugins, warnFn) {
  plugins = plugins || []

  // Either process each if its an array, or directly if singular
  if (typeof plugins.map !== 'undefined') {
    plugins = plugins.map(processPlugin)
  } else {
    plugins = processPlugin(plugins)
  }

  // Return stylus function after postcss processing
  return function (style) {
    style = this || style

    const filename = style.options.filename

    // Grab stylus' ouput css before it's compiled to file
    style.on('end', function (err, css) {
      // Exit on error
      if (err) {
        return err
      }

      const processOptions = {
        from: filename,
        to: path.join(
          path.dirname(filename),
          path.basename(filename, path.extname(filename))
        ) + '.css'
      }

      // If stylus has a sourcemap, ensure postcss also generates one
      if (style.sourcemap) {
        processOptions.map = { annotation: false }
      }

      // Run postcss with user plugins
      const processed = postcss(plugins).process(css, processOptions)

      // If sourcemaps generated, combine them
      if (processed.map && style.sourcemap) {
        const comboMap = map.transfer({
          fromSourceMap: processed.map.toString(),
          toSourceMap: style.sourcemap
        })

        style.sourcemap = JSON.parse(comboMap)
      }

      // Pipe postcss errors to console
      if (!warnFn || typeof warnFn !== 'function') {
        warnFn = console.error
      }

      processed.warnings().forEach(warnFn)

      return processed.css
    })
  }
}
