const gulp = require('gulp');
const sfdx = require('sfdx-node');
const yargs = require('yargs');
const through = require('through2');
const xml = require('gulp-xml');
const gutil = require('gulp-util');
const path = require('path');
const colors = gutil.colors;
const fs = require('fs');
const pad = require('pad');

let fieldConfigData = fs.readFileSync('config/field-check-overrides.json', 'UTF8');
let fieldConfig = JSON.parse(fieldConfigData);

//Setup CI environment from config/.ci.env
if(process.env.CI){
    require('dotenv').config({path: 'config/.ci.env'});
    
}


/**
 * TASK: init
 * 
 * Setup new scratch org, push source, assign permissionset
 * import data and open new scratch org
 * 
 * depends: create, init:push, init:assign, init:import
 */
gulp.task('init', ['create', 'init:push', 'init:assign', 'init:import'], ()=>open());


/**
 * TASK: auth
 * 
 * Find dev hub or authorize
 * If no default dev hub is found performs auth
 * 
 */
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

const webAuth = () => sfdx.auth.web()

/**
 * TASK: create
 * 
 * Create new scratch org
 * 
 * depends: auth
 */
gulp.task('create', ['auth'], () => createScratchOrg());

const createScratchOrg = (definitionfile = 'config/project-scratch-def.json', setdefaultusername = true) => {    
    return sfdx.org.create({
        'definitionfile': definitionfile,
        'setdefaultusername': setdefaultusername    
    });
}

/**
 * TASK: init:push
 * 
 * Push source to scratch org, depends on create
 * 
 * depends: create
 */
gulp.task('init:push', ['create'], () => sourcePush());

const sourcePush = () => sfdx.source.push({quiet: false});

/**
 * TASK: init:assign
 * Assigns dreamhouse permission set
 * 
 * depends: init:push
 */
gulp.task('init:assign', ['init:push'], () => assignPermissionSet());


const assignPermissionSet = (permsetname = 'DreamHouse') => {
    return sfdx.user.permsetAssign({
        'permsetname': permsetname
    })
}

/**
 * TASK: init:import
 * 
 * Import data into scratch org
 * 
 * depends: init:assign
 */
gulp.task('init:import', ['init:assign'],  () =>  importData());

const importData = (plan = 'data/sample-data-plan.json') => {
    return sfdx.data.treeImport({
        'plan': plan,
        'quiet': false
    });
}

/**
 * TASK: watch
 * 
 * Check for changes to fields and run check:fields
 * Check for changes to classes/triggers and run push
 * Poll for changes from scratch org
 * 
 */
gulp.task('watch', () => {
    gulp.watch('force-app/**/*.field-meta.xml', ['check:fields'])
    gulp.watch(['force-app/**/*.cls', 'force-app/**/*.trigger'], ['push']);

    pollPull();
});

gulp.task('check:fields', () => {
    return gulp.src('**/*.field-meta.xml')
    .pipe(xml({outType: false}))
    .pipe(checkFieldDescription())
    .pipe(checkLabelNameMismatch())
})

/**
 * TASK: clean
 * 
 * Mark scratch org for deletion
 * 
 */
gulp.task('clean', () => {
    return list()
    .then(getScratchOrg)
    .then(deleteOrg)
});


const deleteOrg = (org) => {
    if(org){
        return sfdx.org.delete({
            'targetusername': org.username,
            'quiet': false,
            'noprompt': true
        })
    }
}

/****** FIELD CHECKS ********/
const checkFieldDescription = () => {
    return validateXML((file) => {
        let field = JSON.parse(file.contents.toString());
        if(field.CustomField && !field.CustomField.description && !skipField(file.path, field.CustomField.fullName[0])){
            warn('Field', `missing description`, null, path.relative('src', file.path))
        }
    });
}

const checkLabelNameMismatch = () => {
    return validateXML((file) => {
        let field = JSON.parse(file.contents.toString());
        let label = field.CustomField.label[0];
        let stdLabel = `${label.split(' ').join('_')}__c`.replace(/[\W]+/g, "");
        if(field.CustomField && stdLabel != field.CustomField.fullName && !skipField(file.path, field.CustomField.fullName[0])){
            warn('Field', `label mismatch`, `found ${colors.yellow(field.CustomField.fullName)} should be ${colors.green(stdLabel)}`, path.relative('src', file.path))
        }
    });
}


/****** HELPERS ********/

const sourcePull = () => sfdx.source.pull({quiet:false});

const pollPull = () => {
    gutil.log('Checking dev hub for changes...')
    sfdx.source.pull({quiet:false}).then(function(){
        setTimeout(pollPull, 10000);
    });
}


const list = sfdx.org.list;


const runTests = () => {
    return sfdx.apex.testRun({
        'resultformat': 'human',
        'quiet': false
    }).then(function(results){
        if(results.summary.outcome !== 'Passed'){
            throw new gutil.PluginError('Test Run', {
                message: 'Tests are failing'
            });
        }
    });
}


const open = () =>{
    return !process.env.CI && sfdx.org.open({quiet: false});
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


const getObjectFromFieldPath = (fieldPath) => {
    return path.basename(path.dirname(path.dirname(fieldPath)));
}

const skipField = (fieldPath, fullName) => {
    let parentObject = getObjectFromFieldPath(fieldPath);
    return fieldConfig[parentObject].includes(fullName);
   
}

const warn = (type, subtype, msg, path) => {
    let prefix = `${' '.repeat(11)}${colors.yellow.bold(`${type} warning (${colors.cyan(subtype)})`)}`;
    gutil.log(`${colors.white(path)}`);
    console.log(`${prefix} ${msg ||''}`);
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
 


/****** DEV TASKS ********/
gulp.task('assign', () => assignPermissionSet());

gulp.task('data', () => importData());

gulp.task('open', open);

gulp.task('test', runTests)

gulp.task('list', list);

gulp.task('push' , sourcePush);

gulp.task('pull', sourcePull);


