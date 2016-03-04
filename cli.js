#!/usr/bin/env node

'use strict';

require('./lib/impress.cli');

if (!module.parent) {
  impress.cli.run();
}
