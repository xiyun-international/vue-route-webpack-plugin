const fs = require('fs');
const path = require('path');
const sep = path.sep;
const chokidar = require('chokidar');

class VueRouteWebpackPlugin {
  constructor(options = {}) {
    // 文件扩展名
    this.extension = options.extension || ['vue'];
    // 扫描目录
    this.directory = options.directory || `src${sep}views`;
    // 路由文件存放路径
    this.routeFilePath = options.routeFilePath || `src${sep}router${sep}children.js`;
    this._extensionRegexp = new RegExp(`.${this.extension.join('$|.')}$`);
  }

  apply(compiler) {
    compiler.hooks.afterPlugins.tap('VueRouteWebpackPlugin', () => {
      const routerFile = path.resolve(this.routeFilePath);
      this.generatorRoute(routerFile);
      console.log('路由文件生成成功');
      if (process.env.NODE_ENV === 'development') {
        const watcher = chokidar.watch(path.resolve(this.directory), {
          ignored: /(^|[\/\\])\../,
          persistent: true
        });

        // TODO：当监听到某个文件变动时，只改动这个文件的路由，而不是再扫描一遍目录
        watcher.on('change', path => {
          this.generatorRoute(routerFile);
          console.log('路由文件生成成功');
        })
      }
    })
  }

  scanDir(dir, cache) {
    const list = fs.readdirSync(dir);
    list.forEach(li => {
      const stat = fs.statSync(path.resolve(dir, li));
      if (stat.isDirectory()) {
        this.scanDir(path.resolve(dir, li), cache);
      } else if (this._extensionRegexp.test(li)) {
        const content = fs.readFileSync(path.resolve(dir, li), 'utf8');
        const regexp = RegExp('@route\(.*\)', 'g');
        let res = null;
        let matches;
        while ((matches = regexp.exec(content)) !== null) {
          if (matches[0].indexOf(',') > 0) {
            res = /@route\((['"].*\1),\s*(['"].*\2)\)/.exec(matches[0]);
          } else {
            res = /@route\((.*)\)/.exec(matches[0]);
          }
          if (res !== null) {
            const routeStr = res[1].replace(/['"]/g, '');
            const componentName = routeStr.replace(/[/:?*-]/g, '');
            const alias = res[2] ? res[2].replace(/['"]/g, '') : null;
            const relatePath = (/.*\/src(\/views.*)/.exec(dir))[1];

            cache.push({
              import: `import ${componentName} from '@${relatePath}/${li}';`,
              route: {
                path: routeStr,
                name: routeStr,
                component: componentName,
                alias
              }
            })
          }
        }
      }
    })
  }

  generatorRoute(routerFile) {
    let cache = [];
    this.scanDir(path.resolve('src', 'views'), cache);
    const _imports = [];
    const _routes = [];
    cache.forEach(item => {
      _imports.push(item.import);
      _routes.push(item.route);
    });
    const rawArr = [];
    const length = _imports.length;
    _imports.forEach((item, idx) => {
      rawArr.push(`${item}\n${idx === length - 1 ? '\n' : ''}`);
    });
    rawArr.push('export default [\n');
    _routes.forEach(item => {
      rawArr.push(`  {\n    path: '${item.path}',\n    name: '${item.component}',\n    component: ${item.component},\n${item.alias !== null ? `    alias: '${item.alias}',\n`: ''}  },\n`)
    });
    rawArr.unshift('/* eslint-disable */\n');
    rawArr.push('];\n');
    fs.writeFileSync(routerFile, rawArr.join(''));
  }
}

module.exports = VueRouteWebpackPlugin;
