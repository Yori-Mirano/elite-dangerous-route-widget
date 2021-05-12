
# EDRTW (Elite Dangerous Route Tracking Widget)
A widget intended to be displayed on a stream via a browser source which shows the position on the current route.

![Example](docs/images/example.png)

![Legend](docs/images/legend.png)

## Features
- Show in real time the current route
- Show your current position on the route
- Show name of each system on the route
- Compact view for system with generic name (those that contain numbers)
- Indicate if the primary star of each system is scoopable or not, a neutron or white dwarf
- Customizable theme color

## Prerequisites
Make sure you have installed all of the following prerequisites on your machine:

- [Node.js (v12)](https://nodejs.org/dist/latest-v12.x/) - Download & Install Node.js and the npm package manager.


## Installation 
```bash
npm install
```

Check if the directory path of your E:D logs are correct in the `config.json` file, `edLogDir` parameter. The default is the Windows default directory of E:D install.


## Usage/Examples
```bash
npm start
```

Open `http://localhost:3000` in a browser or as source in OBS or equivalent.