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
    this._directoryRegexp = this.directoryRegExp(this.directory);
  }

  directoryRegExp(path) {
    if (path.charAt(0) === '/' || path.charAt(0) === '\\') {
      path = path.substring(1);
    }
    const pathSplit = path.split(/[/|\\]/);
    const first = pathSplit.shift();
    return new RegExp(`.*[/|\\\\]${first}[/|\\\\](${pathSplit.join(sep)})(.*)`)
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
        const context = Object.create(null);
        context.counter = 0;
        while ((matches = regexp.exec(content)) !== null) {
          if (matches[0].indexOf(',') > 0) {
            res = /@route\((['"].*\1),\s*(['"].*\2)\)/.exec(matches[0]);
          } else {
            res = /@route\((.*)\)/.exec(matches[0]);
          }
          if (res !== null) {
            const relatePath = this._directoryRegexp.exec(dir);
            if (relatePath === null) {
              throw new Error('项目目录配置不正确');
            }
            const routeStr = res[1].replace(/['"]/g, '');
            const alias = res[2] ? res[2].replace(/['"]/g, '') : null;
            const componentName = routeStr.replace(/[/:?*-]/g, '');

            const data = {
              import: null,
              route: {
                path: routeStr,
                name: componentName,
                component: null,
                alias
              }
            }
            
            if (context.counter === 0) {
              context.component = componentName;
              context.import = `import ${componentName} from '@/${relatePath[1]}${relatePath[2]}/${li}';`.replace('\\', '/');
              data.import = context.import;
            }
            data.route.component = context.component;
            cache.push(data);
            context.counter++;
          }
        }
      }
    })
  }

  generatorRoute(routerFile) {
    let cache = [];
    this.scanDir(path.resolve(this.directory), cache);
    const _imports = [];
    const _routes = [];
    cache.forEach(item => {
      if (item.import != null) {
        _imports.push(item.import);
      }
      _routes.push(item.route);
    });
    const rawArr = [];
    const length = _imports.length;
    _imports.forEach((item, idx) => {
      rawArr.push(`${item}\n${idx === length - 1 ? '\n' : ''}`);
    });
    rawArr.push('export default [\n');
    _routes.forEach(item => {
      rawArr.push(`  {\n    path: '${item.path}',\n    name: '${item.name}',\n    component: ${item.component},\n${item.alias !== null ? `    alias: '${item.alias}',\n`: ''}  },\n`)
    });
    // rawArr.unshift('/* eslint-disable */\n');
    rawArr.push('];\n');
    fs.writeFileSync(routerFile, rawArr.join(''));
  }
}

module.exports = VueRouteWebpackPlugin;
