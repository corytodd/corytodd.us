(function($){
    $(document).ready(function() {     
        var results = [];   
        ghids.forEach(function(id) {
            lookupGithubProjects(id, function(data) {
                
                results.push(data);
                if(ghids.length === results.length) {

                    $("#spinner").hide("slow");

                    var allProjects = [].concat.apply([], results);
                    allProjects.sort(function(a, b) {
                        if(a.stars > b.stars) return -1;
                        if(a.stars < b.stars) return 1;
                        return 0;
                    })
                    $("#github-panel").append(allProjects.map(Item).join(''));
                }
            });
        });            
    }); // end of document ready
})(jQuery); // end of jQuery name space


const ghids = ["corytodd", "catodd"];
const Item = ({ url, lang, name, desc, stars }) => 
// `
//     <p><a href="${url}"class="list-group-item"><span class="badge" data-badge-caption="stars">${stars}</span>${name}</a> - ${desc}</p>
//     `; 
     `
     <li class="collection-item">
        <span class="title"><h5><a href="${url}">${name}</a></h5></span>
        <p>${lang}<br>
         ${desc}
        </p>
     </li>
    `;


function lookupGithubProjects(id, cb) {

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

                    templatedData.push({ 
                            url: res.html_url,
                            name: res.name,
                            desc: res.description,
                            stars: res.stargazers_count,
                            lang: res.language,
                        });

                    if(templatedData.length  === myRepos.repositories.length) {
                        cb(templatedData);
                    }
                });    
            }, this);
        }
    );
}
