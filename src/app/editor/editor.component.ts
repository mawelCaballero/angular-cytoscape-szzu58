import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef, Injectable, NgZone } from '@angular/core';

import { DropEvent } from 'angular-draggable-droppable';

import cytoscape = require('cytoscape');
//import * as cytoscape from 'cytoscape';




//Importing cytoscape to the component
//import cytoscape = require('cytoscape');

//Importing cytoscape extension, gridGuide
var jquery = require('jquery');
var gridGuide = require('cytoscape-grid-guide');
//import edgehandles = require('cytoscape-edgehandles')
//Importing cytoscape extension, edgehandles
var edgehandles = require('cytoscape-edgehandles');
//import edgehandles from 'cytoscape-edgehandles'//= require("cytoscape-edgehandles");
//import * as edgehandles from 'cytoscape-edgehandles';
//install edgehandles to cytoscape as an extension
    

    //specify which cytoscape, gridGuide should use, note requires jquery.js
    gridGuide( cytoscape, jquery );
    cytoscape.use(edgehandles);
//import * as edgehandles from 'cytoscape-edgehandles';//const edgehandles = require('cytoscape-edgehandles');




//Interfaces
export interface Comp {
  name?: string;
  value?: number;
  nodeid?: any;
}

export interface Cord {
  x?: number;
  y?: number;
}

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  //changeDetection: ChangeDetectionStrategy.OnPush
})


export class EditorComponent implements OnInit {
  public markComponent:string = 'none';
  public cy: cytoscape.Core;
  public eh: any;
  public gg: any;
  private removedNodesStorage: string[];
  private spiceFile: any;
  private numRes: number = 1;
  private numCap: number = 1;
  private numInd: number = 1;
  public value: string;
  public value1: string;
  public remNode: string;
  private options: any;
  snapping: any = {'x': 0, 'y': 0};
  color: string = 'red';
  over:boolean = false;
  //private logging():void;
  compModel: Comp;
  droppedData: Object = '';
  data: any = { 'id': 5 };
  dragContainerRect: ClientRect;
  dragElementRect: ClientRect;
  public transform: Cord;
  public zoomlevel: number;
  wireId:number = 2;
  @ViewChild('dragContainer') dragContainer: ElementRef<HTMLElement>;
  constructor(private cd:ChangeDetectorRef, private zone: NgZone) {
    this.compModel = {
      name: '',
      value: 0,
      nodeid: 0
    };
    this.transform = {
      x: 0,
      y: 0
    };
    this.options = {
      name: 'preset',

      positions: undefined, // map of (node id) => (position obj); or function(node){ return somPos; }
      zoom: 1, // the zoom level to set (prob want fit = false if set)
      pan: undefined, // the pan level to set (prob want fit = false if set)
      fit: true, // whether to fit to viewport
      padding: 30, // padding on fit
      animate: false, // whether to transition the node positions
      animationDuration: 500, // duration of animation in ms if enabled
      animationEasing: undefined, // easing of animation if enabled
      animateFilter: function (node, i) { return true; }, // a function that determines whether the node should be animated.  All nodes animated by default on animate enabled.  Non-animated nodes are positioned immediately when the layout starts
      ready: undefined, // callback on layoutready
      stop: undefined, // callback on layoutstop
      transform: function (node, position) { return position; } // transform a given node position. Useful for changing flow direction in discrete layouts 
    };


  }


  //comp:Comp;
  //store local graph
  public graph: any = {
    nodes: [
      { data: { id: 'R1', name: 'Resistor', value: 1000,  type:'node', line1:'missing', line2:0} },
      { data: { id: 'C1', name: 'Capacitor', value: 1001, type:'node', line1:0, line2:1} },
      { data: { id: 'I1', name: 'Inductor', value: 1002, type:'node', line1:1, line2:'missing' } }
    ],
    edges: [
      { data: { id: 0, source: 'R1', target: 'C1', type: "bendPoint"} },
      { data: { id: 1, source: 'C1', target: 'I1', type: "bendPoint"} }
    ]
  };

  public showAllStyle: cytoscape.Stylesheet[] = [ // the stylesheet for the graph
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'shape': 'square',
        'label': 'data(id)'
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 3,
        'line-color': '#ccc',
        'target-arrow-shape': 'triangle'
        //'curve-style': 'segments',
        //'source-endpoint': '180deg',
        //'target-endpoint': '0deg'
      }
    },
    {
      selector: 'node[type= "bendPoint"]',
      style:{
        'width': '1.00001px',
        'height': '1.00001px'
      }
    },
    {
      selector:'node[type = "node"]',
      style:{
        'width': '60px',
        'height': '40px',
        'content': 'data(id)',
        'font-size': 4,
        'text-valign': 'center',
        'text-halign': 'center'
      }
    },
    {
      selector:'edge[type = "bendPoint" ]',
      style:{
        'width': 1,  
        'target-arrow-shape': 'none',
        'opacity': 1
      }
    },
    {
      selector:'.eh-handle',
      style:{
        'label':''
      }
    },
    {
      selector:'.eh-ghost',
      style:{
        'label':''
        
      }
    }
  ];
  



  ngOnInit() {
    //this.cd.markForCheck(); // marks path
    
    
    // Initialize cytoscape


    this.cy = cytoscape({
      container: document.getElementById('cy'),
      elements: this.graph,
      style: this.showAllStyle, // the stylesheet for the graph,

      layout: {
        name: 'random'
      },
      boxSelectionEnabled: true
    });
    //grid-guide defaults
    let options = {
    // On/Off Modules
    /* From the following four snap options, at most one should be true at a given time */
    snapToGridOnRelease: true, // Snap to grid on release
    snapToGridDuringDrag: true, // Snap to grid during drag
    snapToAlignmentLocationOnRelease: false, // Snap to alignment location on release
    snapToAlignmentLocationDuringDrag: false, // Snap to alignment location during drag
    distributionGuidelines: false, // Distribution guidelines
    geometricGuideline: false, // Geometric guidelines
    initPosAlignment: false, // Guideline to initial mouse position
    centerToEdgeAlignment: false, // Center to edge alignment
    resize: false, // Adjust node sizes to cell sizes
    parentPadding: false, // Adjust parent sizes to cell sizes by padding
    drawGrid: true, // Draw grid background

    // General
    gridSpacing: 20, // Distance between the lines of the grid.

    // Draw Grid
    zoomDash: true, // Determines whether the size of the dashes should change when the drawing is zoomed in and out if grid is drawn.
    panGrid: true, // Determines whether the grid should move then the user moves the graph if grid is drawn.
    gridStackOrder: -1, // Namely z-index
    gridColor: '#dedede', // Color of grid lines
    lineWidth: 1.0, // Width of grid lines

    // Guidelines
    guidelinesStackOrder: 4, // z-index of guidelines
    guidelinesTolerance: 2.00, // Tolerance distance for rendered positions of nodes' interaction.
    guidelinesStyle: { // Set ctx properties of line. Properties are here:
        strokeStyle: "#8b7d6b", // color of geometric guidelines
        geometricGuidelineRange: 400, // range of geometric guidelines
        range: 100, // max range of distribution guidelines
        minDistRange: 10, // min range for distribution guidelines
        distGuidelineOffset: 10, // shift amount of distribution guidelines
        horizontalDistColor: "#ff0000", // color of horizontal distribution alignment
        verticalDistColor: "#00ff00", // color of vertical distribution alignment
        initPosAlignmentColor: "#0000ff", // color of alignment to initial mouse location
        lineDash: [0, 0], // line style of geometric guidelines
        horizontalDistLine: [0, 0], // line style of horizontal distribution guidelines
        verticalDistLine: [0, 0], // line style of vertical distribution guidelines
        initPosAlignmentLine: [0, 0], // line style of alignment to initial mouse position
    },

    // Parent Padding
    parentSpacing: -1 // -1 to set paddings of parents to gridSpacing
};

    //edgehandles defaults
    let defaults = {
      preview: true, // whether to show added edges preview before releasing selection
      hoverDelay: 150, // time spent hovering over a target node before it is considered selected
      handleNodes: 'node', // selector/filter function for whether edges can be made from a given node
      snap: true, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
      snapThreshold: 20, // the target node must be less than or equal to this many pixels away from the cursor/finger
      snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
      noEdgeEventsInDraw: false, // set events:no to edges during draws, prevents mouseouts on compounds
      disableBrowserGestures: true, // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
      handlePosition: function (node) {
        return 'middle top'; // sets the position of the handle in the format of "X-AXIS Y-AXIS" such as "left top", "middle top"
      },
      handleInDrawMode: false, // whether to show the handle in draw mode
      edgeType: function (sourceNode, targetNode) {
        // can return 'flat' for flat edges between nodes or 'node' for intermediate node between them
        // returning null/undefined means an edge can't be added between the two nodes
        return 'flat';
      },
      loopAllowed: function (node) {
        // for the specified node, return whether edges from itself to itself are allowed
        return false;
      },
      nodeLoopOffset: -50, // offset for edgeType: 'node' loops
      nodeParams: function (sourceNode, targetNode) {
        // for edges between the specified source and target
        // return element object to be passed to cy.add() for intermediary node
        return {};
      },
      edgeParams: function (sourceNode, targetNode, i) {
        // for edges between the specified source and target
        // return element object to be passed to cy.add() for edge
        // NB: i indicates edge index in case of edgeType: 'node'
        return {};
      },
      ghostEdgeParams: function () {
        // return element object to be passed to cy.add() for the ghost edge
        // (default classes are always added for you)
        return {id:this.sourceNode+this.targetNode};
      },
      show: function (sourceNode) {
        // fired when handle is shown
      },
      hide: function (sourceNode) {
        // fired when the handle is hidden
      },
      start: function (sourceNode) {
        // fired when edgehandles interaction starts (drag on handle)
      },
      complete: function (sourceNode, targetNode, addedEles) {
        // fired when edgehandles is done and elements are added
        
      },
      stop: function (sourceNode) {
        // fired when edgehandles interaction is stopped (either complete with added edges or incomplete)
        
      },
      cancel: function (sourceNode, cancelledTargets) {
        // fired when edgehandles are cancelled (incomplete gesture)
      },
      hoverover: function (sourceNode, targetNode) {
        // fired when a target is hovered
      },
      hoverout: function (sourceNode, targetNode) {
        // fired when a target isn't hovered anymore
      },
      previewon: function (sourceNode, targetNode, previewEles) {
        // fired when preview is shown
      },
      previewoff: function (sourceNode, targetNode, previewEles) {
        // fired when preview is hidden
      },
      drawon: function () {
        // fired when draw mode enabled
      },
      drawoff: function () {
        // fired when draw mode disabled
      }
    };

    
    this.cy.gridGuide(options);
    
    this.eh = this.cy.edgehandles(defaults);

    this.eh.disable();
    //this.cy.edgehandles.disableDrawMode();
    
    //let layout = this.cy.layout(this.options);
    //layout.run();
    this.cy.minZoom(0.2);
    this.cy.maxZoom(2);
    this.zoomlevel = this.cy.zoom();
    //this.cy.edgehandles('drawon()');
    //console.log(this.zoomlevel);

    //edgehandles defaults
    //Dragg elements



    //Drag
    /*dragStart(dragElement: HTMLElement) {
      this.dragElementRect = dragElement.getBoundingClientRect();
      this.dragContainerRect = this.dragContainer.nativeElement.getBoundingClientRect();
    }*/
    /*this.numOfNodes = calculateNumberOfNodes();
    //ERror here
    function calculateNumberOfNodes(){
      this.cy.nodes().forEach( function (value) {
        let number =+1; 
      });
      console.log(this.number);
      return this.number;
    }*/

  }
  dragging({ x, y }) {
    this.transform.x = x - 150;
    this.transform.y = y;
    //console.log('x:' + x + ' y:' + y);
  }
  onDrop({ dropData }: DropEvent<any>): void {
    this.addNode(dropData);

  }
  dragEnter(){
    this.snapping = {'x': 20, 'y': 20};
    this.color = 'pink';
    this.over = true;
  }
  dragLeave(){
    this.snapping = {'x': 0, 'y': 0};
    this.color = 'pink';
    this.over = false;
  }

  //trying to add/remove a node on click
  addNode(item: string) {
    /*this.prevNode = this.numOfNodes;
    this.numOfNodes =+ 1;*/
    //this.zoomlevel = this.cy.zoom();
    //console.log(this.zoomlevel);
    if (item === "Resistor") {

      this.numRes += 1;
      this.cy.add([{
        group: 'nodes',
        data: { id: 'R' + this.numRes, name: item, value: 1000 },
        renderedPosition: { x: this.transform.x+this.cy.zoom(), y: this.transform.y+this.cy.zoom() }
      }]);
    }
    else if (item === "Capacitor") {
      this.numCap += 1;
      this.cy.add([{
        group: 'nodes',
        data: { id: 'C' + this.numCap, name: item, value: 1000 },
        renderedPosition: { x: this.transform.x, y: this.transform.y + 50 }
      }]);
    }
    else if (item === "Inductor") {
      this.numInd += 1;
      this.cy.add([{
        group: 'nodes',
        data: { id: 'C' + this.numInd, name: item, value: 1000 },
        renderedPosition: { x: this.transform.x, y: this.transform.y + 100 }
      }]);

      //console.log("elements: %j", this.cy.json(this.cy.json()));
    }
    /*else if (item === "conNode"){
      this.cy.add([{
        group: 'nodes',
        data:{id:"con"+this.numOfCon, }
      }])
    }*/
    this.cy.nodes().forEach(function( ele ){
      console.log( ele.data() );
    });
    

    //console.log(this.cy.elements().data());
    let layout = this.cy.layout(this.options);
    layout.run();
    //console.log(this.graph.nodes);
    //this.cd.markForCheck();
    /*this.cy.add([{
      group: 'nodes',
      data: { id: this.numOfNodes, name: item, value: 1000 }
    }, {
      group: 'edges',
      data: { id: this.prevNode + ''+ this.numOfNodes , source: this.prevNode, target: this.numOfNodes }
    }
    ]);
    let layout = this.cy.layout({
      name: 'grid',
      rows: 1
    });
    layout.run();*/
  }

  removeNode(remNode: string) {
    //this.removedNodesStorage.push(this.remNode);
    if (this.remNode.startsWith('R')) {
      this.numRes -= 1;
    }
    else if (this.remNode.startsWith('C')) {
      this.numCap -= 1;
    }
    else if (this.remNode.startsWith('I')) {
      this.numInd -= 1;
    }
    this.cy.remove('#' + this.remNode);
  }
  addEdge() {
    this.value;
    this.value1;
    console.log(this.value + ' ' + this.value1);
    //add check if node exists
    this.cy.add([{
      group: 'edges',
      data: { id: this.value + this.value1, source: this.value, target: this.value1 }
    }]);
    
    let layout = this.cy.layout(this.options);
    /*let layout = this.cy.layout({
      name: 'preset'
    });*/
    layout.run();

  }
  evtListener() {
    this.cy.one('tap', (event) => {
      //this.eh.enableDrawMode();
      
      var evtTarget = event.target;
      if(evtTarget.isNode()){
      //console.log('clicked ' + evtTarget.data('name'));
      //console.log('clicked ' + evtTarget.id(value));
      //console.log(this.cy.extent());
      this.markComponent = evtTarget.name;
      //setBackgroundcolor(evtTarget.name);
      this.compModel = {
        name: evtTarget.data('name'),
        value: evtTarget.data('value'),
        nodeid: evtTarget.data('id')
      };
      console.log(this.compModel.name);
      console.log(this.compModel.value);
      console.log(this.compModel.nodeid);
      console.log(this.cy.json());
      }
      else if (evtTarget.isEdge()){
        console.log('this is an edge');
        this.markComponent = "";
      }
      else{
        console.log('this is the background');
        this.markComponent = "";
      }
      

    });
    
    /*this.cy.on('mousedown', (event) => {
      var evtTarget = event.target;
      console.log('here now');
      this.cy.edgehandles('drawon');
    });

    this.cy.on('mouseup', (event) =>{
      var evtTarget = event.target;
      console.log('quit now');
      this.cy.edgehandles('drawoff');
    });*/
  }
  setBackgroundcolor(idToChange:string){
      
  }

  /*checkIfNodeMissing(nodeMiss:string){
    if(nodeMiss.startsWith('R') && this.removed){

    }
  }*/
}