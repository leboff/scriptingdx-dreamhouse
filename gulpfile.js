const gulp = require('gulp');
const sfdx = require('./lib/sfdx-node');
const yargs = require('yargs');
const through = require('through2');
const xml = require('gulp-xml');
const gutil = require('gulp-util');
const path = require('path');
const colors = gutil.colors;
const pad = require('pad');
//Setup CI environment from config/.ci.env
if(process.env.CI){
    require('dotenv').config({path: 'config/.ci.env'});
}

//Setup CI environment from config/.ci.env
if(process.env.CI){
    require('dotenv').config({path: 'config/.ci.env'});
}

gulp.task('init', ['auth'], () => {
    return createScratchOrg()
    .then(sourcePush)
    .then(() => assignPermissionSet())
    .then(() => importData())
    .then(open);
});

gulp.task('auth', () =>{
    return list()
    .then(getDevHub)
    .then((devHub) => {
        //if we have a dev hub, good return it;
        if(devHub) return Promise.resolve(devHub);

        //otherwise if we're CI jwtAuth, otherwise webauth a dev hub
        return process.env.CI ? authJwt() : authWeb();
    })
    .then(list);
});
gulp.task('create', () => {
    return createScratchOrg();
});

gulp.task('assign', () => assignPermissionSet());
gulp.task('data', () => importData());
gulp.task('open', () => open());

gulp.task('test', () => runTests())

gulp.task('clean', () => {
    return list()
    .then(getScratchOrg)
    .then(deleteOrg)
});

gulp.task('pull', () => {
    return sourcePull();
});

gulp.task('create', ['auth'] , () => {
    return createScratchOrg();
});

gulp.task('check:fields', () => {
    return gulp.src('**/*.field-meta.xml')
    .pipe(xml({outType: false}))
    .pipe(checkFieldDescription())
    .pipe(checkLabelNameMismatch())
})

gulp.task('watch', () => {
    gulp.watch('src/**/*.field-meta.xml', ['check:fields'])
    gulp.watch('src/**/*.cls', ['push']);
});
gulp.task('list', () => list());
gulp.task('push' , () => sourcePush())

const authWeb = () => {
    return sfdx.auth.webLogin({
        setdefaultdevhubusername: true,
        setalias: 'HubOrg'
    });
}

const authJwt = () => {
    return sfdx.auth.jwtGrant({
        clientid: process.env.CONSUMERKEY,
        jwtkeyfile: 'assets/server.key',
        username: process.env.USERNAME,
        setdefaultdevhubusername: true,
        setalias: 'HubOrg'
    });
}

const webAuth = () =>
    sfdx.auth.web()

const createScratchOrg = (definitionfile = 'config/project-scratch-def.json', setdefaultusername = true) => {    
        return sfdx.org.create({
            'definitionfile': definitionfile,
            'setdefaultusername': setdefaultusername    
        });
}

const runTests = () => {
    return sfdx.apex.testRun({
        'resultformat': 'human'
    }).then(function(results){
        if(results.summary.outcome !== 'Passed'){
            throw new gutil.PluginError('Test Run', {
                message: 'Tests are failing'
            });
        }
    });
}
const sourcePull = () => {
    return sfdx.source.pull();
}

const sourcePush = () => {
    return sfdx.source.push();
}

const assignPermissionSet = (permsetname = 'DreamHouse') => {
    return sfdx.user.permsetAssign({
        'permsetname': permsetname
    })
}
const importData = (plan = 'data/sample-data-plan.json') => {
    return sfdx.data.treeImport({
        'plan': plan
    });
}

const open = () =>{
    return !process.env.CI && sfdx.org.open();
}

const list = () => {
    return sfdx.org.list();
}
const getDevHub = (list) => {
    let devHub = list && list.nonScratchOrgs && list.nonScratchOrgs.filter(function(org){
        return org.isDevHub && org.isDefaultDevHubUsername;
    });

    return devHub && devHub.length > 0 && devHub[0]
}
const getScratchOrg = (list) => {
    let defaultOrg = list.scratchOrgs && list.scratchOrgs.filter(function(org){
        if(yargs.argv.username) return (org.username == yargs.argv.username || org.alias == yargs.argv.username);
        
        return org.isDefaultUsername;
    });
    return defaultOrg && defaultOrg.length>0 && defaultOrg[0]
}

const deleteOrg = (org) => {
    if(org){
        return sfdx.org.delete({
            'targetusername': org.username,
            'noprompt': true
        })
    }
}


const checkFieldDescription = () => {
    return validateXML((file) => {
        let field = JSON.parse(file.contents.toString());
        if(field.CustomField && !field.CustomField.description){
            warn('Field', `missing description`, null, path.relative('src', file.path))
        }
    });
}

const checkLabelNameMismatch = () => {
    return validateXML((file) => {
        let field = JSON.parse(file.contents.toString());
        let stdLabel = `${field.CustomField.label[0].split(' ').join('_')}__c`;
        if(field.CustomField && stdLabel != field.CustomField.fullName){
            warn('Field', `label mismatch`, `found ${colors.yellow(field.CustomField.fullName)} should be ${colors.green(stdLabel)}`, path.relative('src', file.path))
        }
    });
}

const warn = (type, subtype, msg, path) => {
    msg = pad(msg||'' ,60,{colors:true});    
    let prefix = pad(`${colors.yellow.bold(`${type} warning (${colors.cyan(subtype)})`)}`,40, {colors:true});

    gutil.log(`${prefix} ${msg} ${colors.white(path)}`);
}


const validateXML = (validator) => {
    let _stream = through.obj(function(file, enc, cb){
        if(file.isStream()){
             gutil.log(colors.yellow('Streams not supported for field check'));
        }
        if(file.isBuffer()){
            validator(file);
        } 
        this.push(file);
        cb();
    });
 
    _stream.on('error', (err) =>  gutil.log(colors.red('An error occured processing the file')));
 
    return _stream;
 
 }
 
