/**
 * 解析路由配置
 */
module.exports = function parseRoute(contentArr) {
  let matchOption = '';
  // 路由总配置项
  const routeConfigs = [];
  // 记录对象配置的 key
  let configKey = '';
  let index = 0;
  // 用来记录上一次匹配的结果
  let beforeCharacter = '';

  // 记录子配置项数据
  let normalObjectData = {};
  let normalObjectKey = '';
  let normalObjectValue = '';

  // 触发器
  function emit(type, data) {
    switch (type) {
      case 'matchOption':
        matchOption += data;
        break;
      case 'setPath':
        routeConfigs[index] = routeConfigs[index] || {};
        routeConfigs[index].path = routeConfigs[index].path || '';
        routeConfigs[index].path += data;
        beforeCharacter = data;
        break;
      case 'setAlias':
        routeConfigs[index].alias = routeConfigs[index].alias || '';
        routeConfigs[index].alias += data;
        beforeCharacter = data;
        break;
      case 'endStringConfig':
        index++;
        matchOption = '';
        beforeCharacter = '';
        break;
      case 'addConfigKey':
        configKey += data;
        break;
      case 'setConfigKey':
        routeConfigs[index] = routeConfigs[index] || {};
        routeConfigs[index][configKey] = '';
        break;
      case 'resetConfigKey':
        configKey = '';
        break;
      case 'setConfigValue':
        routeConfigs[index][configKey] += data;
        break;
      case 'endObjectConfigOfString':
        index++;
        matchOption = '';
        break;
      case 'addNormalObjectKey':
        normalObjectKey += data;
        break;
      case 'addNormalObjectValue':
        normalObjectValue += data;
        break;
      case 'resetNormalObjectKey':
        normalObjectKey = '';
        break;
      case 'resetNormalObjectValue':
        normalObjectValue = '';
        break;
      case 'setNormalObject':
        normalObjectData[normalObjectKey] = normalObjectValue;
        normalObjectKey = '';
        normalObjectValue = '';
        break;
      case 'resetNormalObject':
        normalObjectData = {};
        normalObjectKey = '';
        normalObjectValue = '';
        break;
      case 'endNormalObject':
        routeConfigs[index][configKey] = { ...normalObjectData }
        normalObjectData = {};
        normalObjectKey = '';
        normalObjectValue = '';
        index++;
        configKey = '';
        matchOption = '';
        break;
    }
  }

  // 状态开始
  function start(c) {
    if (c === "@") {
      // console.log('start', c);
      return optionStart;
    } else {
      // // console.log('start return：', c);
      return start;
    }
  }

  // 选项开始状态
  function optionStart(c) {
    // console.log('intoOption', c);
    if (c.match(/[a-z]/)) {
      // 如果等于 route 后还进这来，就不对了
      if (matchOption === 'route') {
        return start;
      }
      emit('matchOption', c);
      return optionStart;
    } else if (c === '(') {
      return beforeOption(c);
    } else {
      return start;
    }
  }

  // 选项开始前
  function beforeOption(c) {
    // console.log('beforeOption', c);
    if (matchOption !== 'route') {
      return start;
    } else if (c.match(/[\s\t\f\n]/)) {
      return beforeOption;
    } else {
      return intoOption;
    }
  }

  // 进入解析选项的状态
  function intoOption(c) {
    // console.log('intoOption', c);
    if (c === '\'' || c === '"') {
      // 如果解析到引号，就是简单的行级配置
      return stringPath(c);
    } else if (c === "{") {
      // 如果解析到大括号，就是对象配置的方式
      return beforeObjectConfig;
    } else {
      return start;
    }
  }

  // 对象配置前的状态
  function beforeObjectConfig(c) {
    // console.log('beforeObjectConfig', c);
    if (c.match(/[\n\s\t\f\*\/]/)) {
      return beforeObjectConfig;
    } else {
      return objectConfig(c);
    }
  }

  // 进入到对象配置状态
  function objectConfig(c) {
    // console.log('objectConfig', c);
    if (c.match(/[a-zA-Z0-9]/)) {
      emit('addConfigKey', c);
      return objectConfig;
    } else if (c.match(/[\s\t]/)) {
      return objectConfig;
    } else if (c === ':') {
      emit('setConfigKey', c);
      return beforeObjectConfigValue;
    } else {
      emit('resetConfigKey');
      // TODO
      return start;
    }
  }

  // 开始对象值状态之前
  function beforeObjectConfigValue(c) {
    // console.log('beforeObjectConfigValue', c);
    if (c.match(/[\s\t]/)) {
      return beforeObjectConfigValue;
    } else {
      return objectConfigValue(c);
    }
  }

  // 对象值的状态
  function objectConfigValue(c) {
    // console.log('objectConfigValue', c);
    if (c === '\'' || c === '"') {
      return objectConfigStringValue(c);
    } else if (c === '{') {
      return beforeNormalObject;
    } else {
      // TODO
      return start;
    }
  }

  function beforeNormalObject(c) {
    // console.log('beforeNormalObject', c);
    if (c.match(/[\s\n\t\f\/*]/)) {
      return beforeNormalObject;
    } else if (c === '}') {
      return endNormalObject;
    } else {
      return normalObjectState(c);
    }
  }

  function normalObjectState(c) {
    // console.log('normalObjectState', c);
    if (c.match(/[a-zA-Z0-9_]/)) {
      emit('addNormalObjectKey', c)
      return normalObjectState;
    } else if (c === ':') {
      return beforeNormalObjectValue;
    } else {
      return endNormalObject(c);
    }
  }

  function beforeNormalObjectValue(c) {
    // console.log('beforeNormalObjectValue', c);
    if (c.match(/[\s\t\f]/)) {
      return beforeNormalObjectValue;
    } else {
      return normalObjectValueState(c);
    }
  }

  function normalObjectValueState(c) {
    // console.log('normalObjectValueState', c);
    if (c.match(/[a-zA-Z\-_'"]/)) {
      emit('addNormalObjectValue', c)
      return normalObjectValueState;
    } else if (c.match(/[,\s\n\t\f\/*]/)) {
      // 继续进行下一次匹配
      emit('setNormalObject');
      return beforeNormalObject;
    } else if (c === '}') {
      emit('setNormalObject');
      return endNormalObject;
    } else {
      return beforeEndOption;
    }
  }

  function endNormalObject(c) {
    // console.log('endNormalObject', c);
    if (c === ',') {
      // 继续解析对象的配置
      emit('endNormalObject')
      return beforeObjectConfig;
    } else {
      return beforeEndOption(c);
    }
  }

  function beforeEndOption(c) {
    // console.log('beforeEndOption', c);
    if (c.match(/[\n\s\t\f\/*]/)) {
      return beforeEndOption;
    } else {
      emit('endNormalObject')
      return endOption;
    }
  }

  function endOption(c) {
    return start;
  }

  // 进入到配置字符串值的状态
  function objectConfigStringValue(c) {
    // console.log('objectConfigStringValue', c);
    if (c.match(/[0-9a-zA-Z\/\-_:?*\(\|\)\[\]'"]/)) {
      emit('setConfigValue', c);
      return objectConfigStringValue;
    } else {
      // 进行下一次匹配的时候，还原
      emit('resetConfigKey');
      return endObjectConfigStringValue(c);
    }
  }

  // 字符串值结束后，会继续转到上一个状态执行
  function endObjectConfigStringValue(c) {
    // console.log('endObjectConfigStringValue', c);
    if (c.match(/[,\s\n\f\t\*\/]/)) {
      return endObjectConfigStringValue;
    } else if (c.match(/[a-zA-Z]/)) {
      return objectConfig(c);
    } else if (c === '}') {
      return beforeEndConfigOfString;
    } else {
      emit('endObjectConfigOfString');
      return start;
    }
  }

  function beforeEndConfigOfString(c) {
    // console.log('beforeEndConfigOfString', c);
    if (c.match(/[\s\n\t\f]/)) {
      return beforeEndConfigOfString;
    } else {
      // 包括 if (c === ')')
      emit('endObjectConfigOfString');
      return start;
    }
  }

  // 字符串路由状态，字符串也要一同拼接
  function stringPath(c) {
    // console.log('stringPath', c);
    // vue 路由支持正则配置
    if (c.match(/[0-9a-zA-Z\/\-_:?*\(\|\)\[\]'"]/)) {
      if (!((beforeCharacter === '\'' || beforeCharacter === '"') && c === ')')) {
        emit('setPath', c);
      }
      return stringPath;
    } else {
      return endStringPath(c);
    }
  }

  // 结束行级 path 状态
  function endStringPath(c) {
    // console.log('endStringPath', c);
    if (c.match(/[\s\t]/)) {
      return endStringPath;
    } else if (c === ',') {
      return beforeStringAlias;
    } else {
      // 包括了 if (c === ')')
      emit('endStringConfig');
      return start;
    }
  }

  // 进入 alias 前
  function beforeStringAlias(c) {
    // console.log('beforeStringAlias', c);
    if (c.match(/[\s\t]/)) {
      return beforeStringAlias;
    } else if (c === '\'' || c === '"') {
      // 进入到行级 alias
      return stringAlias(c);
    } else {
      // 包括了 if (c === ')')
      emit('endStringConfig');
      return start;
    }
  }

  // 进入到行级 alias
  function stringAlias(c) {
    // console.log('stringAlias', c);
    // alias 也假装支持正则配置吧
    if (c.match(/[0-9a-zA-Z\/\-_:?*\(\|\)\[\]'"]/)) {
      if (!((beforeCharacter === '\'' || beforeCharacter === '"') && c === ')')) {
        emit('setAlias', c);
      }
      return stringAlias;
    } else {
      // 包括了 if (c === ')') 和 alias 匹配失败，还需要保留 path
      emit('endStringConfig');
      return start;
    }
  }

  // 设置初始状态
  let state = start;

  for (let c of contentArr) {
    // // console.log('loop', c);
    state = state(c);
  }
  return routeConfigs;
}
