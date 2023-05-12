const AWS = require("aws-sdk");
const regiao = "us-east-1";


module.exports = (nome_secret) => {
	AWS.config.region=regiao;
	const client = new AWS.SecretsManager({ regiao });
	
	const SecretId = nome_secret;
	return new Promise((resolve, reject) => {
		client.getSecretValue({ SecretId }, (err, data) => {
			if (err) {
				reject(err);
			} else {
				resolve(data.SecretString);
			}
		});
	});
};
