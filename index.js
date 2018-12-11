// Sensor Mirror Ext

/* global _, inherits, AutomationModule, _module:true */
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

  self.parentDevice = self.controller.devices.get(this.config.device)
  console.log('[SME] Mirroring device', self.parentDevice.get('metrics:title'))

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
  if (!_.isUndefined(parentDevice) && !_.isUndefined(parentDevice.get)) {
    this.vDev.set('metrics:level', parentDevice.get('metrics:level'))
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
