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

## Disclaimer of Support/Ownership

This tool was developed partially because [I](https://github.com/jonas-kell) had a use for it in the completion of my [master thesis](https://github.com/jonas-kell/master-thesis-documents).
While this thesis (and other projects correlated to it) reference the tool and make use of it, at no point were any non-personal resources tied to its development.
I did not receive pay for my work on this (nor for the work on the thesis) at any point and also no non-monetary resources like server time or getting a laptop/computer were used to develop this project.
While server resources have been granted by the `University of Augsburg`, to complete my master thesis, none of these were used for advancing this project in any capacity - just this project was also used to advance my thesis.

All work on this was done in my free time and with my free will and had no ties to any other (university) projects.
Because of this, I as the only contributor consider myself to have full ownership of the code without obligations to any third party.
For this reason I consider the current license model ([MIT](./LICENSE) at the time of writing) to be correctly applicable to the best of my knowledge and no entity other than myself might have any hidden claims towards the (partial) ownership of this software.

The open source components that are used in this work are all referenced in the respective package-manager files (e.g. `package.json`) and no license-infringing modifications/actions have been made to any of them.
