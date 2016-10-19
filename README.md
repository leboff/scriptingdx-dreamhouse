#DreamHouse Developer Keynote Demo

[![Deploy on Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Source-based deploy

On the command line:

```bash
git clone https://github.com/heroku/dreamhouse-deveynote-sdx
cd dreamhouse-sdx

heroku create
heroku addons:create salesforce
heroku buildpacks:add -i 1 https://github.com/heroku/salesforce-buildpack.git

git push heroku master
```
