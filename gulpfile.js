const gulp = require('gulp');
const sfdx = require('sfdx-node');
const yargs = require('yargs');
const through = require('through2');
const xml = require('gulp-xml');
const gutil = require('gulp-util');
const path = require('path');
const colors = gutil.colors;
const pad = require('pad');

gulp.task('init', () => {
    return createScratchOrg()
    .then(sourcePush)
    .then(() => assignPermissionSet())
    .then(() => importData())
    .then(open);
});
gulp.task('open', () =>{
    open();
})
gulp.task('clean', () => {
    return list()
    .then(getDefaultScratchOrg)
    .then(deleteOrg)
});

gulp.task('pull', () => {
    return sourcePull();
});

gulp.task('check:fields', () => {
    return gulp.src('**/*.field-meta.xml')
    .pipe(xml({outType: false}))
    .pipe(checkFieldDescription())
    .pipe(checkLabelNameMismatch())
})

gulp.task('watch', () => {
    gulp.watch('**/*.field-meta.xml', ['check:fields'])
})


const createScratchOrg = (definitionfile = 'config/project-scratch-def.json', setdefaultusername = true) => {
    return sfdx.org.create({
        'definitionfile': definitionfile,
        'setdefaultusername': setdefaultusername
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
    return sfdx.org.open();
}

const list = () => {
    return sfdx.org.list();
}

const getDefaultScratchOrg = (list) => {
    let defaultOrg = list.scratchOrgs && list.scratchOrgs.filter(function(org){
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
 