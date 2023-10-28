# Math Manipulator

## Build

The project is automatically built with Github Actions.
Online Deployment can be found on Github Pages: https://jonas-kell.github.io/math-manipulator/

## Development

Requires only a working installation of Docker Compose.

```sh
docker compose up
```

### Testing

```sh
docker compose run --rm app npm test
```

## Contributing

This currently is only a research project for my personal/academic use.
Feel free to submit bugfixes and raise general issues about the system behaving wrong/unexpected in general.

For the general implementation of new operators. A demo commit can he found here: [70c3e0e0a9ceb8cd32fcbb7f2bcbfa81f31e68c0](https://github.com/jonas-kell/math-manipulator/commit/70c3e0e0a9ceb8cd32fcbb7f2bcbfa81f31e68c0)
You can raise pull requests with working implementations if you require more operations with generally useful features.
Please do not raise issues that you need new operators I will not implement them for you if they do not serve a greater use for everybody.
