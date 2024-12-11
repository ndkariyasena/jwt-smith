# Verdaccio Registry

Verdaccio will be accessible at [http://localhost:4873](http://localhost:4873)

### How to use the npm package manager

Get into the container

```bash
docker exec  -it  verdaccio-registry  sh
```

To publish your first package just:

1. Create user inside the docker container.

```bash
~ $ npm adduser  --registry  http://localhost:4873/
npm notice Log in on http://localhost:4873/
Username:
Password:
Email: (this IS public)

Logged in on http://localhost:4873/.
```

2. Go to the project to publish.

```bash
npm login  --registry  http://localhost:4873/
npm publish  --registry  http://localhost:4873/
```

Go To [http://localhost:4873](http://localhost:4873) and refresh you will see your package available

3. Install package from local registry.

Go to your project where you want to use the package.

```bash
npm install my-module --registry http://localhost:4873
```
