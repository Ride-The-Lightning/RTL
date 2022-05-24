function subjectToString(subject) {
  const aggr = [];
  Object.keys(subject).forEach((k) => {
    if (typeof subject[k] === 'string') {
      aggr.push(`${k}=${subject[k]}`);
    } else if (Array.isArray(subject[k]) && subject[k].length > 0) {
      const temp = [];
      subject[k].forEach((v) => {
        temp.push(`${k}=${v}`);
      });
      aggr.push(temp.reverse().join(','));
    }
  });
  return aggr.reverse().join(',');
}

export default (rejectUnauthorized = false) => {
  return function (req, res, next) {
    const { connection, protocol } = req;

    if (protocol === 'https' && (connection.authorized || rejectUnauthorized === false)) {
      try {
        const { subject } = connection.getPeerCertificate();
        const CN = subject.CN;
        const DN = subjectToString(subject);
        req.identity = {
          DN,
          CN
        };
        return next();
      } catch (e) {
        //if this server requsts certs, but there is an error getting them, DO NOT PASS GO!
        return res.status(500).json({
          message: e.toString()
        });
      }
    }
    return res.status(403).json({
      message: 'forbidden'
    });
  };
};
