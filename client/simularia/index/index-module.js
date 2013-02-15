
define(function(require, exports, module) {
    var app=null;
    exports.initModule=function(application){
        app=application;


    };
    function log(msg){
        //console.log(msg);
    }
    var requestAnimFrame = (function(){
        return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(callback, element){
                window.setTimeout(callback, 1000 / 60);
            };
    })();


    THREE.Vector3.zero=function() {
        return new THREE.Vector3(0, 0, 0);
    };

    THREE.Vector3.random=function(max) {
        var v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        v.multiplyScalar(max);
        return v;
    };

    THREE.Mesh.prototype.merge=function(otherParticle,scene) {
        if (otherParticle.geometry.radius>this.geometry.radius){
            otherParticle.merge(this);
            return;
        }
        otherParticle.destroyed = true;
        log("particle "+this.id +" collide with "+otherParticle.id/*+" new radius "+radiusFromVolume(this.volume+otherParticle.volume)*/);
        this.setVolume(this.volume+otherParticle.volume,scene);
    };
    THREE.Mesh.prototype.calculateVolume=function (){
        this.volume=Math.pow(this.geometry.radius,3) * (4.0/3.0) * Math.PI;
    };
    THREE.Mesh.prototype.calculateMass=function (){
        this.mass=this.volume*this.density;
    };
    function radiusFromVolume(volume) {

        return Math.pow((volume * 3.0) / (4.0 * Math.PI), 1 / 3);
    }

    THREE.Mesh.prototype.checkStar=function(scene) {
        if (this.geometry.radius > 160.9 && !this.isStar) {
            this.star = new THREE.PointLight(0xFFFFFF, 1.0);
            this.isStar = true;
            this.star.position.copy(this.position);

            // add to the scene
            scene.add(this.star);
        }
    };

    THREE.Mesh.prototype.setVolume=function (volume,scene){
        log("old volume:"+this.volume+" new volume:"+volume);

        this.volume=volume;

        var newRadius = radiusFromVolume(volume);
        var oldRadius = this.geometry.radius;
        log("old radius:"+oldRadius+" new radius:"+newRadius);
        this.geometry.radius = newRadius;
        this.calculateMass();
        var fact = newRadius/oldRadius;
        this.checkStar(scene);

        log(fact);
        this.scale.x *= fact;
        this.scale.y *= fact;
        this.scale.z *= fact;



    };

    THREE.Mesh.prototype.log=function(){
        function vectorLog(v) {
            return "["+Math.round(v.x * 100) / 100 +","+ Math.round(v.y * 100) / 100 + ","+Math.round(v.z * 100) / 100+"]";
        }

        log("#" + this.id +
            " speed:" + vectorLog(this.speed)+
            " acc:"+vectorLog(this.acceleration)+
            " mass:"+this.mass+
            " radius:"+this.geometry.radius
        );
    };

    THREE.Mesh.prototype.updatePosition=function(speed){
        this.position.add(speed);

        if (this.isStar){
            this.star.position.add(speed);
        }
    };


    function ShowSimulation($scope, $http, $location,$routeParams) {





        var particles=[];
        $scope.particlesCount=40;
        $scope.force=0.00;
        $scope.collisions=0;


        var deltaCameraX=0;
        var deltaCameraY=0;
        var camera,scene,renderer,sphereMaterials;
        var center=THREE.Vector3.zero();
        $scope.cameraPosition=function(e){
            if (camera){
                if (e.altKey){
                    deltaCameraX= (-e.pageX+350)/20;
                    deltaCameraY= (+e.pageY-480)/20;
                }else {
                    /*camera.position.x -= -(e.pageX-350 );
                    camera.position.y -= -(e.pageY-550 );*/
                    deltaCameraX=0;
                    deltaCameraY= 0;
                }
                console.log((e.pageX-350)+":"+(e.pageY-480));

                renderer.render(scene, camera);
            }

        };
        window.addEventListener('DOMMouseScroll', mousewheel, false);
        window.addEventListener('mousewheel', mousewheel, false);

        function mousewheel( e )
        {
            if (camera){

                var d = ((typeof e.wheelDelta != "undefined")?(-e.wheelDelta):e.detail);
                camera.position.z+= d;
                renderer.render(scene, camera);
            }
        }


        /*$scope.zoomPlus=function(){
            camera.position.z -= 100;
            renderer.render(scene, camera);
        };
        $scope.zoomMinus=function(){
            camera.position.z += 100;
            renderer.render(scene, camera);
        };
        $scope.zoomGiu=function(){
            camera.position.y -= 100;
            renderer.render(scene, camera);
        };
        $scope.zoomSu=function(){
            camera.position.y += 100;
            renderer.render(scene, camera);
        };
        $scope.zoomSin=function(){
            camera.position.x -= 100;
            renderer.render(scene, camera);
        };
        $scope.zoomDes=function(){
            camera.position.x += 100;
            renderer.render(scene, camera);
        };*/



        $scope.setupScene=function(){
            renderer = new THREE.WebGLRenderer();
            // create the sphere's material
            sphereMaterials=[];
            for (var i=0;i<100;i++){
                var color = new THREE.Color();
                color.setRGB(Math.random(),Math.random(),Math.random());
                var mat=new THREE.MeshPhongMaterial({
                    color: color
                });
                sphereMaterials.push(mat);
            }




            // set the scene size
            var WIDTH = "600",
                HEIGHT = "600";

            // set some camera attributes
            var VIEW_ANGLE = 45,
                ASPECT = WIDTH / HEIGHT,
                NEAR = 0.1,
                FAR = 10000;

            // get the DOM element to attach to
            // - assume we've got jQuery to hand
            var $container = $('#simularia');

            // create a WebGL renderer, camera
            // and a scene
            camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

            scene = new THREE.Scene();

            // add the camera to the scene
            scene.add(camera);
            scene.add(new THREE.AxisHelper(300));

            // the camera starts at 0,0,0
            // so pull it back
            camera.position.z = 400;
            camera.position.x = 20;
            camera.position.y = 50;



            // start the renderer
            renderer.setSize(WIDTH, HEIGHT);

            // attach the render-supplied DOM element
            $container.append(renderer.domElement);



            for(var x=0;x<$scope.particlesCount;x++){
                newParticle();
            }

            for(var i= 0,l=particles.length;i<l;i++){
                scene.add(particles[i]);
            }



            // create a point light
            var pointLight = new THREE.PointLight(0xFFFFFF,1);

            // set its position
            pointLight.position=THREE.Vector3.zero();

            // add to the scene
            scene.add(pointLight);
            var light = new THREE.AmbientLight( 0x404040 ); // soft white light scene.add( light );
            scene.add(light);
            // draw!
            renderer.render(scene, camera);

        };

        $scope.start=function(){

            requestAnimFrame(step);


        };


        function updatePositions() {
            for (var i = 0, l = particles.length; i < l; i++) {
                var particle = particles[i];
                particle.updatePosition(particle.speed);
            }
        }
        function updateSpeeds() {
            for (var i = 0, l = particles.length; i < l; i++) {
                var particle = particles[i];
                /* if (particle.pos.add(particle.speed).distanceFrom(center)>300){
                 particle.speed=particle.speed.multiply(-1);
                 }*/
                var speed = THREE.Vector3.zero();
                speed.copy(particle.speed);
                speed.add(particle.acceleration.multiplyScalar(0.01));
                speed.multiplyScalar(0.999999);
                if (isNaN(speed.x) || isNaN(speed.y) || isNaN(speed.z))
                    log("bad accel for "+particle.id);
                else
                    particle.speed.copy(speed);
            }
        }
        function removeDestroyed() {
            var destroyed=false;
            for (var thisIdx = 0, l = particles.length; thisIdx < l; thisIdx++) {
                var thisParticle = particles[thisIdx];
                if (thisParticle.destroyed){
                    log("particle "+thisParticle.id +" is destroyed and collecting.");
                    scene.remove(thisParticle);
                    scene.remove(thisParticle.accelArrow);
                    scene.remove(thisParticle.speedArrow);
                    particles.splice(thisIdx,1);
                    thisIdx--;
                    l--;
                    destroyed=true;
                }

            }
            if (destroyed){
                updateDistances();
                removeDestroyed();
            }

        }
        function updateDistances() {


            for (var thisIdx = 0, l = particles.length; thisIdx < l; thisIdx++) {
                var thisParticle = particles[thisIdx];
                if (!thisParticle.destroyed){

                    for (var otherIdx = thisIdx+1; otherIdx < l; otherIdx++) {
                        var otherParticle = particles[otherIdx];
                        var distance = thisParticle.position.distanceTo(otherParticle.position);
                        thisParticle.distances[otherIdx]=otherParticle.distances[thisIdx]=distance;
                        if (distance<thisParticle.geometry.radius+otherParticle.geometry.radius){

                            $scope.collisions++;

                            thisParticle.merge(otherParticle,scene);

                        }
                    }

                    //thisParticle.setPosition(thisParticle.pos.add(thisParticle.speed));
                }

            }
        }


        function updateForces() {
            var totalForce=0;
            for (var thisIdx = 0, l = particles.length; thisIdx < l; thisIdx++) {
                var thisParticle = particles[thisIdx];
                for (var otherIdx = thisIdx+1; otherIdx < l; otherIdx++) {
                    var otherParticle = particles[otherIdx];
                    var distance = thisParticle.distances[otherIdx];

                    var force = thisParticle.mass*otherParticle.mass/Math.pow(distance,2);

                    totalForce+=force;
                    if (thisParticle.destroyed || otherParticle.destroyed)
                        force = 0;

                    var forceVector=THREE.Vector3.zero();
                    forceVector.subVectors(otherParticle.position,thisParticle.position);
                    forceVector.multiplyScalar(force/distance);

                    var invertedForceVector=THREE.Vector3.zero();
                    invertedForceVector.subVectors(thisParticle.position,otherParticle.position);
                    invertedForceVector.multiplyScalar(force/distance);

                    thisParticle.forces[otherIdx]=forceVector;
                    otherParticle.forces[thisIdx]=invertedForceVector;
                }

            }
            $scope.force=Math.round(totalForce*100/particles.length)/100;
        }
        function updateAccelerations() {

            for (var thisIdx = 0, l = particles.length; thisIdx < l; thisIdx++) {
                var thisParticle = particles[thisIdx];
                var resultantForce=THREE.Vector3.zero();

                for (var otherIdx = 0; otherIdx < l; otherIdx++) {
                    if (thisIdx!=otherIdx)
                        resultantForce.add(thisParticle.forces[otherIdx]);
                }
                var acceleration = resultantForce.divideScalar(thisParticle.mass);
                if (isNaN(acceleration.x) || isNaN(acceleration.y) || isNaN(acceleration.z))
                    log("bad accel for "+thisParticle.id);
                else
                    thisParticle.acceleration=acceleration;
            }
        }
        function drawDirections() {

            for (var thisIdx = 0, l = particles.length; thisIdx < l; thisIdx++) {
                var thisParticle = particles[thisIdx];

                if (thisParticle.speedArrow)
                    scene.remove(thisParticle.speedArrow);
                if (thisParticle.accelArrow)
                    scene.remove(thisParticle.accelArrow);
                thisParticle.speedArrow=new THREE.ArrowHelper(
                    thisParticle.speed,
                    thisParticle.position,
                    thisParticle.speed.length()*10,0x0000ff
                );
                thisParticle.accelArrow=new THREE.ArrowHelper(
                    thisParticle.acceleration,
                    thisParticle.position,
                    thisParticle.acceleration.length()*10,0x00ff00
                );
                scene.add(thisParticle.accelArrow);
                scene.add(thisParticle.speedArrow);
            }
        }
        function step(){


            updateDistances();
            removeDestroyed();
            updatePositions();
            updateSpeeds();
            updateForces();
            updateAccelerations();
            drawDirections();

            for (var thisIdx = 0, l = particles.length; thisIdx < l; thisIdx++) {
                var thisParticle = particles[thisIdx];
                thisParticle.log();
                thisParticle.distances=[];
                thisParticle.forces=[];
            }

            camera.position.x-=deltaCameraX;
            camera.position.y-=deltaCameraY;

                renderer.render(scene, camera);
            $scope.$apply();
            requestAnimFrame(step);
        }


        var particleId=0;


        function newParticle(){
            var radius = 10+Math.random(),
                segments = 16,
                rings =16;

            var particle = new THREE.Mesh(
                new THREE.SphereGeometry(
                    radius,
                    segments,
                    rings),
                sphereMaterials[particleId%100]
            );
            particle.id=particleId;
            particleId++;


            particle.acceleration=THREE.Vector3.zero();
            particle.destroyed=false;
            particle.density=.1;
            particle.distances=[];
            particle.forces=[];
            particle.isStar=false;
            particle.distanceFromCenter=0;
            particle.speed=THREE.Vector3.zero();//Vector.Random(3).multiply(2);


            particle.position.copy(THREE.Vector3.random($scope.particlesCount*5));
            particle.geometry.dynamic = true;
            particle.calculateVolume();
            particle.calculateMass();
            particle.checkStar(scene);

            particles.push(particle);
        }
        function init(){
            $scope.testo="Inserire il testo dei todo da importare qui,uno per riga";
        }
        init();
    }


    exports.route=function($routeProvider){
        $routeProvider.
            when('/', {templateUrl:'simularia/index/simulation.html', controller:ShowSimulation});


    }
});