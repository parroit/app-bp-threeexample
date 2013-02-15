
define(function(require, exports, module) {
    var app=null;
    exports.initModule=function(application){
        app=application;


    };
    function log(msg){
        //console.log(msg);
    }
    Vector.prototype.to3=function(){
        return new THREE.Vector3(this.elements[0],this.elements[1],this.elements[2]);
    };




    function ShowSimulation($scope, $http, $location,$routeParams) {



        var renderer = new THREE.WebGLRenderer();
        // create the sphere's material
        var sphereMaterial =new THREE.MeshLambertMaterial({
            color: 0xCC0000
        });

        var particles=[];
        var totalSpheres=40;




        var camera,scene;
        var center=Vector.Zero(3);
        var collisions=0;
        $scope.zoomPlus=function(){
            camera.position.z -= 100;
            renderer.render(scene, camera)
        };
        $scope.zoomMinus=function(){
            camera.position.z += 100;
            renderer.render(scene, camera)
        };
        $scope.zoomGiu=function(){
            camera.position.y -= 100;
            renderer.render(scene, camera)
        };
        $scope.zoomSu=function(){
            camera.position.y += 100;
            renderer.render(scene, camera)
        };
        $scope.zoomSin=function(){
            camera.position.x -= 100;
            renderer.render(scene, camera)
        };
        $scope.zoomDes=function(){
            camera.position.x += 100;
            renderer.render(scene, camera)
        };
        $scope.setupScene=function(){
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



            for(var x=0;x<totalSpheres;x++){
                newParticle();
            }

            for(var i= 0,l=particles.length;i<l;i++){
                scene.add(particles[i]);
            }



            // create a point light
            var pointLight = new THREE.PointLight(0xFFFFFF,1);

            // set its position
            pointLight.position.x = 0;
            pointLight.position.y = 0;
            pointLight.position.z = 0;

            // add to the scene
            scene.add(pointLight);
            var light = new THREE.AmbientLight( 0x404040 ); // soft white light scene.add( light );
            scene.add(light);
            // draw!
            renderer.render(scene, camera);

        };

        $scope.start=function(){
            setInterval(step,10);
        };


        function updatePositions() {
            for (var i = 0, l = particles.length; i < l; i++) {
                var particle = particles[i];
                particle.setPosition(particle.pos.add(particle.speed));
            }
        }
        function updateSpeeds() {
            for (var i = 0, l = particles.length; i < l; i++) {
                var particle = particles[i];
                /* if (particle.pos.add(particle.speed).distanceFrom(center)>300){
                 particle.speed=particle.speed.multiply(-1);
                 }*/
                var speed = particle.speed.add(particle.acceleration.multiply(0.01)).multiply(0.999999);
                if (isNaN(speed.elements[0]) || isNaN(speed.elements[1]) || isNaN(speed.elements[2]))
                    log("bad accel for "+particle.id);
                else
                    particle.speed=speed;
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
                        var distance = thisParticle.pos.distanceFrom(otherParticle.pos);
                        thisParticle.distances[otherIdx]=otherParticle.distances[thisIdx]=distance;
                        if (distance<thisParticle.geometry.radius+otherParticle.geometry.radius){

                            collisions++;
                            $("#collisions").html(collisions);
                            thisParticle.merge(otherParticle);

                        }
                    }

                    thisParticle.setPosition(thisParticle.pos.add(thisParticle.speed));
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

                    var forceVector=otherParticle.pos.subtract(thisParticle.pos).multiply(force/distance);
                    var invertedForceVector=thisParticle.pos.subtract(otherParticle.pos).multiply(force/distance);

                    thisParticle.forces[otherIdx]=forceVector;
                    otherParticle.forces[thisIdx]=invertedForceVector;
                }

            }
            $("#force").html(Math.round(totalForce*100/particles.length)/100);
        }
        function updateAccelerations() {

            for (var thisIdx = 0, l = particles.length; thisIdx < l; thisIdx++) {
                var thisParticle = particles[thisIdx];
                var resultantForce=Vector.Zero(3);

                for (var otherIdx = 0; otherIdx < l; otherIdx++) {
                    if (thisIdx!=otherIdx)
                        resultantForce=resultantForce.add(thisParticle.forces[otherIdx]);
                }
                var acceleration = resultantForce.multiply(1/thisParticle.mass);
                if (isNaN(acceleration.elements[0]) || isNaN(acceleration.elements[1]) || isNaN(acceleration.elements[2]))
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
                    thisParticle.speed.toUnitVector().to3(),
                    thisParticle.position,
                    thisParticle.speed.modulus()*10,0x0000ff
                );
                thisParticle.accelArrow=new THREE.ArrowHelper(
                    thisParticle.acceleration.toUnitVector().to3(),
                    thisParticle.position,
                    thisParticle.acceleration.modulus()*10,0x00ff00
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
            renderer.render(scene, camera);
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
                sphereMaterial
            );
            particle.id=particleId;
            particleId++;

            particle.merge=function(otherParticle) {
                if (otherParticle.geometry.radius>this.geometry.radius){
                    otherParticle.merge(this);
                    return;
                }
                otherParticle.destroyed = true;
                log("particle "+this.id +" collide with "+otherParticle.id/*+" new radius "+radiusFromVolume(this.volume+otherParticle.volume)*/);
                this.setVolume(this.volume+otherParticle.volume);
            };
            particle.calculateVolume=function (){
                this.volume=Math.pow(this.geometry.radius,3) * (4.0/3.0) * Math.PI;
            };
            particle.calculateMass=function (){
                this.mass=this.volume*this.density;
            };
            function radiusFromVolume(volume) {

                return Math.pow((volume * 3.0) / (4.0 * Math.PI), 1 / 3);
            }

            particle.checkStar=function() {
                if (this.geometry.radius > 160.9 && !this.isStar) {
                    this.star = new THREE.PointLight(0xFFFFFF, 1.0);
                    this.isStar = true;
                    this.star.position.x = this.position.x + 40;
                    this.star.position.y = this.position.y + 40;
                    this.star.position.z = this.position.z + 40;

                    // add to the scene
                    scene.add(this.star);
                }
            };

            particle.setVolume=function (volume){
                log("old volume:"+this.volume+" new volume:"+volume);

                this.volume=volume;

                var newRadius = radiusFromVolume(volume);
                var oldRadius = this.geometry.radius;
                log("old radius:"+oldRadius+" new radius:"+newRadius);
                this.geometry.radius = newRadius;
                this.calculateMass();
                var fact = newRadius/oldRadius;
                this.checkStar();

                console.log(fact);
                this.scale.x *= fact;
                this.scale.y *= fact;
                this.scale.z *= fact;



            };

            particle.log=function(){
                function vectorLog(v) {
                    return "["+Math.round(v.elements[0] * 100) / 100 +","+ Math.round(v.elements[1] * 100) / 100 + ","+Math.round(v.elements[2] * 100) / 100+"]";
                }

                log("#" + this.id +
                    " speed:" + vectorLog(this.speed)+
                    " acc:"+vectorLog(this.acceleration)+
                    " mass:"+this.mass+
                    " radius:"+this.geometry.radius
                );
            };
            particle.setPosition=function(vector){
                this.pos=vector;

                this.position.x=this.pos.elements[0];
                this.position.y=this.pos.elements[1];
                this.position.z=this.pos.elements[2];
                if (this.isStar){
                    this.star.position.x=this.position.x+30;
                    this.star.position.y=this.position.y+30;
                    this.star.position.z=this.position.z+30;
                }
            };
            particle.acceleration=Vector.Zero(3);
            particle.destroyed=false;
            particle.density=.5;
            particle.distances=[];
            particle.forces=[];
            particle.isStar=false;
            particle.distanceFromCenter=0;
            particle.speed=Vector.Zero(3);//Vector.Random(3).multiply(2);
            var vector2 = Vector.Random(3).multiply(400).subtract(Vector.Random(3).multiply(200));
            /* vector2.elements[2]=Math.cos(particleId)*20;
             vector2.elements[1]=-particleId*40+Math.random()*20;
             vector2.elements[0]=particleId*20;*/
            particle.setPosition(vector2);
            particle.geometry.dynamic = true;
            particle.calculateVolume();
            particle.calculateMass();
            particle.checkStar();

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