# vue-route-webpack-plugin

### 介绍

扫描项目文件中的路由配置并生成路由文件的一款 webpack 插件。

使用插件自动生成路由是具有一定好处的。当项目中的路由配置非常多的时候，为了区分业务，你可能需要分成许多个文件来存放这些路由文件，这样就不得不去维护这些路由文件。每当要添加路由的时候，还得重复的写`import` 和路由配置项。使用插件来自动生成路由后，就无需再关心和维护路由文件了。

### 使用方式

#### 安装
```bash
$ yarn add -D @xiyun/vue-route-webpack-plugin
```

#### 配置
在`vue.config.js`或在 webpack 配置文件中加入插件配置：
```js
const VueRouteWebpackPlugin = require('@xiyun/vue-route-webpack-plugin');

module.exports = {
  configureWebpack: {
    plugins: [
      new VueRouteWebpackPlugin({
        // 选项，见下文
      })
    ],
  }
};
```

#### 使用
在需要配置路由的页面级`.vue`文件中加入路由配置：

`假设在 user.vue 文件中：`
```html
<template>
  <div>user</div>
</template>
<script>
// @route('user/list')
// 或
// 第二个参数是路由别名
// @route('user/list', 'user')

// 或使用多行注释
/**
 * @route('user/list')
 * 或
 * @route('user/list', 'user')
 */
export default {
  name: 'user',
  data() {
    return {}
  }
}
</script>
```

**默认情况下**，当你启动开发服务或执行构建的时候，就会在`src/router`目录下生成`children.js`这个路由文件。

假设你的页面文件路径是：`src/views/user/list.vue`，那么生成的路由文件的内容看起来就会是这样的：
```js
import userlist from '@/views/user/list.vue';

export default [
  {
    path: 'user/list',
    name: 'userlist',
    component: userlist,
    // 如果配置了别名
    alias: 'user',
  },
]
```

*因为这个文件会由插件自动生成，所以你可以在 .gitignore 文件中把这个路由文件在版本库中忽略掉，避免多人协同开发时因频繁改动发生冲突。*

#### 默认目录约定

```
src/
  |-views/         (项目文件，插件会扫描该目录下所有 .vue 文件的路由配置)
    |-...
  |-router/        (路由目录)
    |-index.js     (主路由文件，需要引入 children.js 作为子路由来使用)
    |-children.js  (路由文件，由插件自动生成)
```

#### 选项参考

插件提供了以下这些选项供自定义配置
```js
new VueRouteWebpackPlugin({
  // 文件扩展名，默认只查询 .vue 类型的文件，根据实际需要可以进行扩展
  extension: ['vue', 'js', 'jsx'],
  // 插件扫描的项目目录，默认会扫描 'src/views' 目录
  directory: 'src/views',
  // 生成的路由文件存放地址，默认存放到 'src/router/children.js'
  routeFilePath: 'src/router/children.js',
})
```