// Local storage Control Module
const strgCtrl = (() => {
    // Get tags from local storage
    const getT = () => {
        if(localStorage.getItem('tags') && localStorage.getItem('tags') != 'undefined'){
            return JSON.parse(localStorage.getItem('tags'));
        } else return [];
    }

    // Set tags on local storage
    const setT = (tags) => {
        localStorage.setItem('tags', JSON.stringify(tags));
    }

    return {
        getTags: () => {
            return getT();
        },
        setTags: (tags) => {
            setT(tags);
        }
    }
})();

// Data Control Module
const dataCrtl = (() => {
    // Default tags array used when no tags added
    const defaultTags = ['inspire', 'love', 'life'];
    
    // Get tags from local storage
    const tags = strgCtrl.getTags();

    // Create, Read and Delete Tags
    const addTag = tag => {
        tags.push(tag);
        strgCtrl.setTags(tags);
    }

    const removeTag = id => {
        tags.splice(id, 1);
        strgCtrl.setTags(tags);
    }


    return {
        tags: tags,
        defaultTags: defaultTags,
        addTag: addTag,
        removeTag: removeTag,
        getRandomTag: () => {
            if(tags.length){
                return tags[Math.ceil(Math.random() * tags.length-1)];
            }else{
                return defaultTags[Math.ceil(Math.random() * defaultTags.length-1)];
            }
        }
    }
})(strgCtrl);

// Asynchornous communication Control Module
const asynCtrl = (function(){
    // Setting up the base URLs and fetch a random tag
    const base = {
        quoteUrl: 'https://api.paperquotes.com/apiv1/quotes/',
        imgUrl: 'https://api.unsplash.com/', 
        tag: dataCrtl.getRandomTag()
    }

    // Fetch from the Unsplash API 
    const fetchImg = (tag) => {
        return new Promise((resolve, reject) => {
            fetch(base.imgUrl+`photos/random?client_id=${config.unsplashAk}&query=${tag}&orientation=landscape`)
            .then(resp => resolve(resp.json()))
            .catch(err => reject(err))
        })
    }

    // Fetch from the Paper Quote API 
    const fetchQuote = (tag) => {
        return new Promise((resolve, reject) => {
            fetch(`${base.quoteUrl}?tags=${tag}&random=random&order=?`, 
            {headers: {
                "Authorization":config.paperQAk
            }})
            .then(resp => resolve(resp.json()))
            .catch(err => reject(err))
        })
    }
  
    return {
        fetchImg: fetchImg,
        fetchQuote: fetchQuote
    }
})();



// UI Control Module

const uiCtrl = (() => {
    // Refernce to the DOM elements
    const domElements = {
        burgerBtn: document.querySelector('.burger-btn'),
        addBtn: document.querySelector('.form__submit'),
        tags: document.querySelectorAll('.tagsItem'),
        movingHeader: document.querySelector('.header__moving'),
        primaryHeader: document.querySelector('.header__primary'),
        header: document.querySelector('.header'),
        quote: document.querySelector('.quote'),
        form: document.querySelector('form'),
        input: document.getElementById('tag'),
        tagsUl: document.querySelector('.tags'),
        imgWrapper: document.querySelector('.image-wrapper'),
        quoteBox: document.querySelector('.quote__box'),
        quoteBoxAnim: document.querySelector('blockquote.quote__box').lastElementChild,
        reloadBtn:document.querySelector('.quote__btn'),
        relatedTag: document.querySelector('.quote__tag span'),
        attribution: document.querySelector('.footer__attribution')
    }

    // Animating the Header
    let interval;
    const animateHeader = (tagsArr) => {
        let count = 1;
        const tags = [...tagsArr];
        document.querySelector('.header__moving').innerHTML = tags[0];

        const addToDom = function ()  {
            const newDiv = document.createElement('div');
            newDiv.className = 'header__moving';
            newDiv.innerText = tags[count];
            domElements.primaryHeader.replaceChild(newDiv, document.querySelector('.header__moving'));
            if(count < tags.length-1){
                count++;
            } else{
                count = 0;
            }
         }
       // Set or clear interval conditionally
       if(interval) {
            clearInterval(interval);
            if(tags.length>1){
                interval =  setInterval(addToDom, 2500);
            }
        } else{
            if(tags.length>1){
                interval =  setInterval(addToDom, 2500);
            }
        }
      

    }
    // Populate the tags to UI and Update the header animation
    const populateTags = tags => {
        let markup = ``;
        if(tags.length){
            tags.forEach((tag,id) => {
                markup+=`<li class="tags__item" id=${id}><small class="tags__text">${tag}</small><span class="tags__cross">x</span></li>`
            });
            animateHeader(tags);
        }else{
            markup = `<li style="list-style:none;">No Tags added</li>`;
            animateHeader(dataCrtl.defaultTags);
        }
        domElements.tagsUl.innerHTML = markup;
    }


    // Add the placeholder loaders to UI
    const displayLoaders = (tag) => {
        domElements.imgWrapper.innerHTML = '<div class="quote__loader"></div>';
        domElements.quoteBox.innerHTML = '';
        domElements.relatedTag.innerText = tag;
        domElements.quoteBox.classList.add('quote__text--loader');
    }
    

    return{
        getDomElements: () => domElements,
        populateTags: tags => populateTags(tags),
        animateHeader: animateHeader,
        displayLoaders: displayLoaders
    }
})();



// App module
const appCtrl = (() => {
    // Destructuring the dom elements
    const {burgerBtn, tags, reloadBtn,imgWrapper, quoteBox, header, quote, form, input, tagsUl, attribution } = uiCtrl.getDomElements();
    // Use Async Module to fetch data Asynchronously
    const loadData = tag => {
        // Display loaders until data is fetched
        uiCtrl.displayLoaders(tag);
        // Fetch image and handle errors
        asynCtrl.fetchImg(tag)
        .then(resp => {
            imgWrapper.innerHTML =  `<img src="${resp.urls.regular}" class="quote__img" alt="${resp['alt_description']}"></img>`
            attribution.nextElementSibling.innerHTML = `Photo by <a target="_blank" href="https://unsplash.com/@${resp.user.username}?utm_source=quote_generator&utm_medium=referral">${resp.user.name}</a> on <a target="_blank" href="https://unsplash.com/?utm_source=quote_generator&utm_medium=referral">Unsplash</a>`;        
        })
        .catch(err => {
            imgWrapper.innerHTML = `<p class="quote__text image-wrapper__error quote__text--red">Something went wrong! Please change the tags or try again.</p>`
        });
        // Fetch quote and handle errors
        asynCtrl.fetchQuote(tag)
        .then(resp => {
            const randInd = Math.ceil(Math.random() * resp.results.length-1);
            quoteBox.classList.remove('quote__text--loader');
            quoteBox.innerHTML = `<p class="quote__text">${resp.results[randInd].quote}</p>
            <br>
            <small>${resp.results[randInd].author ? resp.results[randInd].author : 'Unknown'}</small>`
        })
        .catch(err => {
            quoteBox.classList.remove('quote__text--loader');
            quoteBox.innerHTML = `<p class="quote__text quote__text--red">Something went wrong! Please change tags or try again.</p>`
        })
    }

    const addEventListeners = () => {

        // Controlling the header show/hide
        const hideHeader = (parent, child) => {
            if(parent){
                parent.firstElementChild.classList.remove('burger-btn__item--trans');
                header.style= 'animation: header-out 0.5s ease-in-out 0s 1 forwards';
                quote.style.animation = 'shift-up 0.5s ease-in-out 0s 1 forwards';
            } else {
                child.classList.remove('burger-btn__item--trans');
                header.style.animation = 'header-out 0.5s ease-in-out 0s 1 forwards';
                quote.style.animation = 'shift-up 0.5s ease-in-out 0s 1 forwards';
            }
        }

        const showHeader = (parent, child) => {
            if(parent){
                parent.firstElementChild.classList.add('burger-btn__item--trans');
                header.style.animation = 'header-in 0.5s ease-in-out 0s 1 forwards';
                quote.style.animation = 'shift-down 0.5s ease-in-out 0s 1 forwards';
            } else {
                child.classList.add('burger-btn__item--trans');
                header.style.animation = 'header-in 0.5s ease-in-out 0s 1 forwards';
                quote.style.animation = 'shift-down 0.5s ease-in-out 0s 1 forwards';
            }
        }
        // Controlling the transfromation of burger btn
        burgerBtn.addEventListener('click', (e)=>{
            if(e.target.childElementCount > 0) {
                if(e.target.firstElementChild.classList.contains('burger-btn__item--trans')){
                    hideHeader(e.target, null);
                } else {
                    showHeader(e.target, null);
                }
            } else if(e.target.classList.contains('burger-btn__item--trans')){
                hideHeader(null, e.target);
            } else {
                showHeader(null, e.target);
            }

        });

        // Tag Validation
        const validateTag = (tag) => {
            if(!dataCrtl.tags.includes(tag)){
                const reg = /^[a-z]{3,}$/i;
                return reg.test(tag);
            } return false;
        }

        // Hanlding the UI input color state red/green/grey
        input.addEventListener('blur', (e) => {
            if(e.target.value){
                if(validateTag(e.target.value)){
                    input.style.border = '1px solid green';
                } else {
                    input.style.border = '1px solid red';
                }
            } else {
                input.style.border = '1px solid grey';
            }
            
        });

        // Submit a tag add to storage and UI
        form.addEventListener('submit', (e) => {
            if(validateTag(tag.value)){
                dataCrtl.addTag(tag.value.toLowerCase());
                tag.value = '';
                input.style.border = '1px solid grey';
                uiCtrl.populateTags(dataCrtl.tags);

            }
            e.preventDefault();
        });

        // Remove a tag from UI and storage
        tagsUl.addEventListener('click' , (e) => {
            if(e.target.classList.contains('tags__cross')){
                dataCrtl.removeTag(e.target.parentElement.id);
                uiCtrl.populateTags(dataCrtl.tags);
            }
        });

        // Refetch data based on a new tag
        reloadBtn.addEventListener('click' , (e) => {
            loadData(dataCrtl.getRandomTag());
        })


    }

    return {
        init: () => {
            addEventListeners();
            uiCtrl.populateTags(dataCrtl.tags);
            loadData(dataCrtl.getRandomTag());
        }
    }
})(uiCtrl, dataCrtl, asynCtrl);

// Initiate the application
appCtrl.init();