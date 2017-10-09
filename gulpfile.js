var gulp = require('gulp');
var sfdx = require('gulp-sfdx');
var yargs = require('yargs');
gulp.task('init', () => {
    return createScratchOrg()
    .then(pushSource)
    .then(() => assignPermissionSet())
    .then(() => importData())
    .then(open);
});

gulp.task('clean', () => {
    return list()
    .then(getDefaultScratchOrg)
    .then(deleteOrg)
});

var createScratchOrg = (definitionfile = 'config/project-scratch-def.json', setdefaultusername = true) => {
    return sfdx.org.create({
        'definitionfile': definitionfile,
        'setdefaultusername': setdefaultusername
    });
}

var pushSource = () => {
    return sfdx.source.push();
}

var assignPermissionSet = (permsetname = 'DreamHouse') => {
    return sfdx.user.permsetAssign({
        'permsetname': permsetname
    })
}
var importData = (plan = 'data/sample-data-plan.json') => {
    return sfdx.data.treeImport({
        'plan': plan
    });
}

var open = () =>{
    return sfdx.org.open();
}

var list = () => {
    return sfdx.org.list();
}

var getDefaultScratchOrg = (list) => {
    var defaultOrg = list.scratchOrgs && list.scratchOrgs.filter(function(org){
        return org.isDefaultUsername;
    });
    return defaultOrg && defaultOrg.length>0 && defaultOrg[0]
}

var deleteOrg = (org) => {
    if(org){
        return sfdx.org.delete({
            'targetusername': org.username,
            'noprompt': true
        })
    }
}