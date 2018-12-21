// Sensor Mirror Ext

/* global _, inherits, AutomationModule, _module:true, zway */
/* exported _module */

function SensorMirrorExt (id, controller) {
  // Call superconstructor first (AutomationModule)
  SensorMirrorExt.super_.call(this, id, controller)
}

inherits(SensorMirrorExt, AutomationModule)

_module = SensorMirrorExt

SensorMirrorExt.prototype.init = function (config) {
  SensorMirrorExt.super_.prototype.init.call(this, config)
  var self = this

  self.parentDevice = self.controller.devices.get(self.config.device)
  console.log('[SME] Mirroring device', self.parentDevice.get('metrics:title'))

  self.targets = _.map(self.config.targets, function (devId) { return dev2node(devId) })
  console.log('[SME] Target devices is', JSON.stringify(self.targets))

  var icon = self.parentDevice.get('metrics:icon')
  var level = self.parentDevice.get('metrics:level')

  var defaults = {
    metrics: {
      title: self.getInstanceTitle()
    }
  }

  var overlay = {
    deviceType: 'sensorMultilevel',
    metrics: {
      icon: icon,
      level: level
    }
  }

  if (self.parentDevice.get('metrics:scaleTitle')) {
    overlay.metrics.scaleTitle = self.parentDevice.get('metrics:scaleTitle')
  }

  self.vDev = this.controller.devices.create({
    deviceId: 'SensorMirrorExt_' + this.id,
    defaults: defaults,
    overlay: overlay,
    moduleId: this.id
  })

  self.onUpdate = _.bind(self.doUpdate, self)
  self.controller.devices.on(self.config.device, 'change:metrics:level', self.onUpdate)
}

SensorMirrorExt.prototype.doUpdate = function (parentDevice) {
  var self = this
  if (!_.isUndefined(parentDevice) && !_.isUndefined(parentDevice.get)) {
    this.vDev.set('metrics:level', parentDevice.get('metrics:level'))

    // Send unsolicited reports
    var tempInt = Math.round(parseFloat(parentDevice.get('metrics:level')) * 100)
    var byteH = (tempInt & 0xff00) >> 8
    var byteL = tempInt & 0x00ff

    console.log('[SME] got value', tempInt, ':', d2h(byteH), d2h(byteL))
    _.each(self.targets, function (nodeId) {
      var nodeInt = parseInt(nodeId)
      console.log('[SME] sending to', nodeInt, '0x31', '0x05', '0x01', '0x42', d2h(byteH), d2h(byteL))
      zway.SendData(nodeInt, [0x31, 0x05, 0x01, 0x42, byteH, byteL])
    })
  }
}

SensorMirrorExt.prototype.stop = function () {
  var self = this

  // Clear event subscription
  self.controller.devices.off(self.config.device, 'change:metrics:level', self.onUpdate)

  // Destroy device
  if (self.vDev) {
    self.controller.devices.remove(self.vDev.id)
    self.vDev = null
  }

  SensorMirrorExt.super_.prototype.stop.call(this)
}

function d2h (byte) { return ('00' + (+byte).toString(16)).toUpperCase().slice(-2) }

function dev2node (devId) {
  var nodeRegex = /_zway_(\d+)-/g
  return nodeRegex.exec(devId)[1]
}
