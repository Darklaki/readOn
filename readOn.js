/*
  Łukasz Szulborski 2018 ReadOn Copyrights
  version: 1.0
*/

((root, core) => {
  'use strict'
  root.readOn = core();
})(this, () => {
  'use strict'

  let defaultOptions = {
    color: '#F44336', //hex, rgb or rgba
    position: 'right', //define side of the screen
    width: '100%', //percentage or pixels
    height: '6px', //percentage or pixels
    blurness: '0px', //blur of the line
    belowWidth: '768px', //screen width in pixels
    lineBelowScreen: false //where to put readOn line
  };

  let setOptions = {};

  let uniqueID = 0;

  //all functions that are bound to event listeners lands here
  const listenerFunctionStack = {};

  // init function
  let go = (textContainer, options = {}) => {
    //init readOn only when user on mobile device
    if(detectIfMobile_()){
        //check if correct
        if (!textContainerExists_(textContainer)) {
          if (typeof textContainer == 'undefined') {
            console.log(`%cReadOn: %cNo selector given in %creadOn.go()`, 'color: #999', 'color: black', 'color: blue');
          }else{
            console.log(`%cReadOn: %c${textContainer} %cnot found in document!`, 'color: #999', 'color: blue', 'color: black');
          }
          return false;
        }else if(readOnInitialized_(textContainer)){
          return false;
        }

        setOptions = produceOptions_(options);
        produceLines_(textContainer, setOptions);
        //check if initial width is ok
        linesVisibility_();
    }
  }

  //stop textContainers from using readOn
  let stop = (textContainer = '') => {
    let textContainerClass = textContainer;
    if (textContainer.length == 0) {
      textContainerClass = '.readOn';
    }
    let nodes = document.querySelectorAll(textContainerClass);
    for (let node of nodes) {
      if (node.classList.contains('readOn') && node.hasAttribute('data-readonid')) {
        let readOnLine = node.querySelector('.readOn-line');
        let readOnID = node.getAttribute('data-readonid');
        node.classList.remove('readOn','readOn-inViewport');
        node.removeAttribute('data-readonid');
        node.removeChild(readOnLine);
        window.removeEventListener('touchend', listenerFunctionStack['touchEnd_'+readOnID]);
        window.removeEventListener('touchstart', listenerFunctionStack['touchStart_'+readOnID]);
        delete listenerFunctionStack['touchEnd_'+readOnID];
        delete listenerFunctionStack['touchStart_'+readOnID];
      }
    }
  }

  // check whether text container exists
  let textContainerExists_ = (textContainer) => {
    let nodeList = document.querySelectorAll(textContainer);
    if (nodeList.length != 0) {
      return nodeList;
    }else{
      return false;
    }
  }

  //check if text container already has readOn initialized
  let readOnInitialized_ = (textContainer) => {
    let nodeList = document.querySelectorAll(textContainer);
    for(let node of nodeList){
      if (node.classList.contains('readOn')) {
        return true;
      }
    }
  }

  let produceOptions_ = (passedOptions) => {
    if (Object.keys(passedOptions).length == 0) {
      return defaultOptions;
    }else{
      return {...defaultOptions, ...passedOptions};
    }
  }

  let produceLines_ = (textContainer, options) => {
    let containerNodes = document.querySelectorAll(textContainer);

    //line
    let lineDOM = document.createElement('div');
    lineDOM.classList.add('readOn-line');
    lineDOM.style.cssText = optionsObjToCSS_(options);
    var parentsObserver = new IntersectionObserver(io => {
      for (let ioElement of io) {
        let textContainer = ioElement.target;
        if (textContainer.classList.contains('readOn')) {
          if (ioElement.intersectionRatio > 0) {
            textContainer.classList.add('readOn-inViewport');
          }else{
            textContainer.classList.remove('readOn-inViewport');
          }
        }
      }
    });

    //append to nodes
    for(let node of containerNodes){
      node.classList.add('readOn');
      node.style.cssText += 'position: relative;';
      let newLine = lineDOM.cloneNode(false);
      let newLineNode = node.appendChild(newLine);
      parentsObserver.observe(node);
      node.setAttribute('data-readonid', uniqueID);

      listenerFunctionStack['touchEnd_'+uniqueID] = () => {
        newLineNode.style.opacity = 0;
      }
      listenerFunctionStack['touchStart_'+uniqueID] = () => {
        //check whether text container is in desired viewport
        if (node.classList.contains('readOn-inViewport')) {
          if(isScreenBottomInTextContainerArea_(node)){
             newLineNode.style.opacity = 1;
             moveLine_(node);
          }
        }
      }
      window.addEventListener('touchend', listenerFunctionStack['touchEnd_'+uniqueID]);
      window.addEventListener('touchstart', listenerFunctionStack['touchStart_'+uniqueID]);

      uniqueID++;

      //init move line
      setTimeout(()=>{
        if( node.classList.contains('readOn-inViewport') &&
            isScreenBottomInTextContainerArea_(node)
          ){
            newLineNode.style.opacity = 0;
            moveLine_(node);
          }
      }, 10)
    }
  }

  let isScreenBottomInTextContainerArea_ = (textContainer) => {
    let nodeBottomDist = textContainer.getBoundingClientRect().bottom;
    let windowHeight = document.documentElement.clientHeight;
    let readOnLine = textContainer.querySelector('.readOn-line');
    if (nodeBottomDist - windowHeight > 0) {
        return true;
    }else{
        return false;
    }
  }

  //convert options object into *textCss*
  let optionsObjToCSS_ = (obj) => {
    let textCss = [];
    for (var prop in obj) {
      if (prop == 'color') {
        textCss += `background-color: ${obj[prop]}; `;
      }else if (prop == 'blurness'){
        textCss += `filter: blur(${obj[prop]}); `;
      }else if (prop == 'position'){
        if (obj[prop] == 'left') {
          textCss += `left: 0px; `;
        }else if (obj[prop] == 'right'){
          textCss += `right: 0px; `;
        }
      }else{
        textCss += `${prop}: ${obj[prop]}; `;
      }
    }
    textCss += `position: absolute; opacity: 0`;
    return textCss;
  }

  //show lines depending on screen size defined in options
  let linesVisibility_ = () => {
    let windowWidth = window.innerWidth;
    let allLines = document.querySelectorAll('.readOn-line');
    if (windowWidth <= setOptions['belowWidth'].slice(0, -2)) {
      for (let line of allLines) {
        line.style.opacity = 1;
      }
    }else{
      for (let line of allLines) {
        line.style.opacity = 0;
      }
    }
  }

  //fires on *touchend* when text container in desired viewport
  //moves readOn line under viewport
  let moveLine_ = (textContainer) => {
    let readOnLine = textContainer.querySelector('.readOn-line');
    let textContainerDist = textContainer.getBoundingClientRect();
    let newBottomPosition = 0;
    if(setOptions.lineBelowScreen){
       newBottomPosition = (textContainerDist.bottom - document.documentElement.clientHeight) - (2 * readOnLine.getBoundingClientRect().height);
    }else{
       newBottomPosition = textContainerDist.bottom - document.documentElement.clientHeight;
    }
    readOnLine.style.bottom = `${newBottomPosition}px`;
  }

  //check user device
  let detectIfMobile_ = () => {
    if( navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)
    ){
        return true;
    }else{
        return false;
    }
  }

  if(detectIfMobile_()){
    // ### listeners ###
    window.addEventListener('resize', linesVisibility_);
  }

  return {
    /* public */
    go: go,
    stop: stop
  }
})
