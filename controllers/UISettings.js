var fs = require('fs');
var file_path = './settings/ui.settings.json';  

exports.getUISettings = (req, res, next) => {
  console.log('Getting UI Settings!');
  fs.readFile(file_path, function(err, data) {
    if (err) {
      console.log('Reading UI Settings Failed!');
      res.status(500).json({
        message: "Reading UI Settings Failed!",
        error: err
      });
    } else {
      console.log('UI theme read successfully');
      res.status(200).json({settings: JSON.parse(data)});
    }
  });
};

exports.updateUISettings = (req, res, next) => {
  fs.writeFile(file_path, JSON.stringify(req.body.updatedSettings), function(err) {
    if (err) {
      console.log('Updating UI Settings Failed!');
      res.status(500).json({
        message: "Updating UI Settings Failed!",
        error: 'Updating UI Settings Failed!'
      });
    } else {
      console.log('UI theme updated successfully');
      res.status(201).json({message: 'UI theme updated successfully'});
    }
  });
};
