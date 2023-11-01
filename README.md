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
npm run open-coverage # Only works if npm is installed. Just open `./coverage/lcov-report/index.html` manually instead
```

## Contributing

This currently is only a research project for my personal/academic use.
Feel free to submit bugfixes and raise general issues about the system behaving wrong/unexpected in general.

For the general implementation of new operators, a demo commit can he found here: [90a42a3fa9e3f29458f70bd662b57c2bf32b8efe](https://github.com/jonas-kell/math-manipulator/commit/90a42a3fa9e3f29458f70bd662b57c2bf32b8efe)
You can raise pull requests with working implementations if you require more operations with generally useful features.
It is important that new tests are included in the pull request, so that all implemented features are covered.
Please do not raise issues that you need new operators I will not implement them for you if they do not serve a greater use for everybody.
