import forge from 'node-forge';
forge.options.usePureJavaScript = true;

//---------------------------------------------------------------------------------------
//Private Module Variables
//---------------------------------------------------------------------------------------
const { assign, freeze, keys } = Object;
const max32BitInt = 2147483647;
//---------------------------------------------------------------------------------------

class CertificateFactory {
  private forge: any = forge;
  private certBundle: any = null;
  private encryptionBits: Number = 2048;
  private certType: String = 'component';
  private validForYears: Number = 10;
  private commonName: String = 'localhost';
  private organizationalUnit: any = 'RTL';
  private organizationName: String = 'RTL';
  private countryName: String = 'US';
  private stateName: String = 'New York';
  private localityName: String = 'New York';
  private altName: String = 'https://localhost';
  private altIp: String = '127.0.0.1';

  //---------------------------------------------------------------------------------------
  //Constructor
  //
  //Input: obj (options object)
  //Output: certificate factory instance
  //---------------------------------------------------------------------------------------
  constructor(opts: any = {}) {
    const {
      altIp = '127.0.0.1',
      certType = 'component',
      commonName = 'localhost',
      countryName = 'US',
      encryptionBits = '2048',
      stateName = 'New York',
      localityName = 'New York',
      organizationName = 'RTL',
      organizationalUnit = 'RTL',
      validForYears = '10'
    } = opts;
    assign(this, {
      certBundle: null,
      altName: `https://${commonName}`,
      altIp,
      certType,
      commonName,
      countryName,
      encryptionBits: parseInt(encryptionBits, 10),
      stateName,
      localityName,
      organizationName,
      organizationalUnit,
      validForYears: parseInt(validForYears, 10)
    });
  }

  //---------------------------------------------------------------------------------------
  //Method: getStaticBundle
  //
  //Input: type <string>
  //Output: bundle <certificate bundle object>
  //
  //This method will generate a constant static cert bundle that can be "shared" between
  //many classes that may require a common certificate set. It has a single input argument
  //that allows external classes to specify which format they would like their cert bundle
  //to be in. (string or buffer)
  //---------------------------------------------------------------------------------------
  public getStaticBundle(type = 'string', password = null) {
    if (!this.certBundle) {
      this.certBundle = freeze(this.generateRandomCerts());
    }

    return this._convertBundle(this.certBundle, type, password);
  }

  //---------------------------------------------------------------------------------------
  //Method: _convertBundle
  //
  //Input: bundle <string certificate bundle>, type <string>
  //Output: bundle <formatted certificate bundle>
  //
  //This method will converts all key value pairs of a certificate bundle to the desired
  //type and returns a new bundle. This also performs a defacto copy of the bundle to
  //prevent outside callers from tampering with each other's returned bundle instance, or
  //the internal cached bundle referenced by getStaticBundle.
  //---------------------------------------------------------------------------------------
  private _convertBundle(bundle, type, password) {
    const newBundle = {};
    const bundleKeys = keys(bundle);
    const converter = type === 'string' ? this._valueToString : this._valueToBuffer;

    if (type === 'p12') {
      return this._bundleToP12(bundle, password);
    }

    bundleKeys.forEach((k) => {
      if (bundle[k]) {
        newBundle[k] = converter(bundle[k]);
      } else {
        newBundle[k] = bundle[k];
      }
    });

    return newBundle;
  }

  //---------------------------------------------------------------------------------------
  //Method: _valueToString
  //
  //Input: v <any>
  //Output: v <string>
  //
  //This method converts its input value to a string and returns it.
  //---------------------------------------------------------------------------------------
  private _valueToString(v) {
    return `${v}`;
  }

  //---------------------------------------------------------------------------------------
  //Method: _valueToBuffer
  //
  //Input: v <any>
  //Output: v <buffer>
  //
  //This method converts its input value to a buffer and returns it.
  //---------------------------------------------------------------------------------------
  private _valueToBuffer(v) {
    return Buffer.from(v);
  }

  //---------------------------------------------------------------------------------------
  //Method: _bundleToP12
  //
  //Input: bundle <string certificate bundle>
  //Output: p12Base64 <base64 encoded .p12 string>
  //
  //This method converts a certificate bundle to a .p12 file that can be used in a browser.
  //---------------------------------------------------------------------------------------
  private _bundleToP12(bundle, password) {
    const {
      forge: { asn1, pki, pkcs12, util }
    } = this;
    const pemCertificate = pki.certificateFromPem(bundle.cert);
    const pemKey = pki.privateKeyFromPem(bundle.key);
    const p12Asn1 = pkcs12.toPkcs12Asn1(pemKey, pemCertificate, password, {
      algorithm: '3des'
    });
    const p12Bytes = asn1.toDer(p12Asn1).getBytes();
    const p12Base64 = util.encode64(p12Bytes);

    return p12Base64;
  }

  //---------------------------------------------------------------------------------------
  //Method: generateRandomCerts
  //
  //Input: none
  //Output: bundle <string certificate bundle>
  //
  //This method utilizes node-forge to create a key/cert/ca bundle entirely in javascript.
  //It uses the factory properties set in the factory constructor to configure the new
  //key/cert/ca bundle, and then returns the newly generated bundle. Directly calling this
  //method will result in new bundles with different private keys, but the certificate
  //x509 attributes will match across all bundles generated with the same factory instance.
  //---------------------------------------------------------------------------------------
  public generateRandomCerts() {
    const {
      forge: { pki }
    } = this;
    //generate a keypair and create an X.509v3 certificate
    const keys = pki.rsa.generateKeyPair(this.encryptionBits);
    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = Math.round(Math.random() * max32BitInt).toString(16);
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + this.validForYears);
    const altNames = [];
    let attrs;
    if (this.certType === 'person') {
      const OUArray = Array.isArray(this.organizationalUnit)
        ? this.organizationalUnit.map((v) => {
            return {
              shortName: 'OU',
              value: v
            };
          })
        : [
            {
              shortName: 'OU',
              value: 'RTL'
            },
            {
              shortName: 'OU',
              value: 'BTC'
            },
            {
              shortName: 'OU',
              value: 'People'
            }
          ];
      attrs = [].concat(
        [
          {
            name: 'countryName',
            value: this.countryName
          },
          {
            name: 'organizationName',
            value: this.organizationName
          }
        ],
        OUArray,
        [
          {
            name: 'commonName',
            value: this.commonName
          }
        ]
      );
    } else {
      attrs = [
        {
          name: 'commonName',
          value: this.commonName
        },
        {
          name: 'countryName',
          value: this.countryName
        },
        {
          shortName: 'ST',
          value: this.stateName
        },
        {
          name: 'localityName',
          value: this.localityName
        },
        {
          name: 'organizationName',
          value: this.organizationName
        },
        {
          shortName: 'OU',
          value: this.organizationalUnit
        }
      ];
      if (this.altName) {
        altNames.push({
          type: 6, // URI
          value: this.altName
        });
      }
      if (this.altIp) {
        altNames.push({
          type: 7, // IP
          ip: this.altIp
        });
      }
    }
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([
      {
        name: 'basicConstraints',
        cA: true
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
      },
      {
        name: 'nsCertType',
        client: true,
        server: true,
        email: true,
        objsign: true,
        sslCA: true,
        emailCA: true,
        objCA: true
      },
      {
        name: 'subjectAltName',
        altNames: altNames
      },
      {
        name: 'subjectKeyIdentifier'
      }
    ]);
    cert.sign(keys.privateKey);

    // convert a Forge certificate to PEM
    // for self generated certs, ca will be undefined
    const pem = pki.certificateToPem(cert);
    const certBundle = {
      key: pki.privateKeyToPem(keys.privateKey),
      cert: pem,
      ca: undefined
    };

    return certBundle;
  }
}

export default CertificateFactory;
