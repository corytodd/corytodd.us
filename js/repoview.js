(function($){
    $(document).ready(function() {        
        ghids.forEach(function(id) {
            lookupGithubProjects(id, $('#github-panel'));
        });            
    }); // end of document ready
})(jQuery); // end of jQuery name space


const ghids = ["corytodd", "catodd"];
const Item = ({ url, name, desc }) => `
    <p><a href="${url}"class="list-group-item">${name}</a> - ${desc}</p>
    `; 


function lookupGithubProjects(id, div) {

    var me = new Gh3.User(id);
    var myRepos = new Gh3.Repositories(me);    

    var templatedData = [];

    myRepos.fetch(
        {
            page : 1, 
            per_page : 50, 
            direction : "desc"
        }, 
        "next",
        function (err, res) {
            if(err) {
                throw "GH error: " + err
            }
            console.log("Repositories", myRepos);

            myRepos.repositories.forEach(function(e, index) {
                        
                var project = new Gh3.Repository(e.name, me);
                project.fetch(function (err, res) {
                    if(err) {
                        console.log("Error", err.message, res.status)
                        throw err
                    }

                    templatedData.push({ url: res.url, name: res.name, desc: res.description});

                    if(templatedData.length  === myRepos.repositories.length) {
                        div.append(templatedData.map(Item).join(''));
                    }
                });    
            }, this);
        }
    );
}
