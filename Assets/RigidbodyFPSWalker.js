// TODO when releasing the skiing key, wait a few hundred ms before switching physic materials
// and/or grounded state: we don't want to do ground-based deceleration when jetpacking

var speed = 10.0;
var gravity = 10.0;
var maxVelocityChange = 10.0;
var canJump = true;
var jumpHeight = 1.5;
private var grounded = false;
var walkingMaterial : UnityEngine.PhysicMaterial;
var skiingMaterial : UnityEngine.PhysicMaterial;
var skiingBoostPercent = 0.05;
var skiingBoostBelowVelocity = 1.0;
var skiingDampeningFactor = 0.02;
var fuelAirControlFactor = 0.5;
var fuelAirControlPenaltyFactor = 0.5;
var freeAirControlFactor = 0.2;
var airDrag = 0.1;
var groundBrakingFactor = 10;

@script RequireComponent(Rigidbody, CapsuleCollider)
 
function Awake ()
{
	rigidbody.freezeRotation = true;
	rigidbody.useGravity = false;
	
}

function GetGroundNormal() {
	var dist = 1;
    var dir : Vector3 = Vector3(0,-1,0);
 	var hit : UnityEngine.RaycastHit;
 	
    //edit: to draw ray also//
    
    //end edit//
 
 	if (Physics.Raycast(transform.position, dir, hit, dist)) {
 		//Debug.DrawRay(hit.point, hit.normal, Color.red);
 		return hit.normal;
 	}
 	else {
 		return null;
 	}
//    if(Physics.Raycast(transform.position,dir,hit,dist)) {
//         //the ray collided with something, you can interact
//         // with the hit object now by using hit.collider.gameObject
//         return hit.collider.gameObject;
//    }
//    else {
//         //nothing was below your gameObject within 10m.
//         return null;
//    }
	return null;
}
     	
	  
function FixedUpdate ()
{
	if (Input.GetMouseButton(0)) {
		Screen.lockCursor = true;
//		collider.material = walkingMaterial;
	}
	
	//if (grounded)
	//{

	var groundNormal = GetGroundNormal();
	//grounded = (groundNormal != null);
	
	// Calculate how fast we should be moving
	var targetVelocity = new Vector3(Input.GetAxis("Horizontal"), 0, Input.GetAxis("Vertical"));
	targetVelocity = transform.TransformDirection(targetVelocity);
	targetVelocity *= speed;

	var skiing = Input.GetButton("Jump");
	var jetpacking = Input.GetMouseButton(1);
	
	if (skiing || !grounded || jetpacking) {
		if (collider.material != skiingMaterial) {
			collider.material = skiingMaterial;
		}
	}
	else {
		if (collider.material != walkingMaterial) {
			collider.material = walkingMaterial;
		}
	}
	
	if (!grounded) {
		rigidbody.drag = airDrag;
	}
	else {
		rigidbody.drag = 0;
	}
	
	//grounded = true;
	//Debug.Log(grounded);
	if (grounded && !skiing && !jetpacking) {
		if (rigidbody.velocity.magnitude > speed) {
			// Decelerate us
			rigidbody.AddForce(-rigidbody.velocity * groundBrakingFactor);
		}
		else if (targetVelocity.magnitude > 0) {
			// Apply a force that attempts to reach our target velocity
			var velocity = rigidbody.velocity;
			var velocityChange = (targetVelocity - velocity);
			velocityChange.x = Mathf.Clamp(velocityChange.x, -maxVelocityChange, maxVelocityChange);
			velocityChange.z = Mathf.Clamp(velocityChange.z, -maxVelocityChange, maxVelocityChange);
			velocityChange.y = 0;
			
			if (groundNormal != null) {
				velocityChange = AdjustGroundVelocityToNormal(velocityChange, groundNormal);
			}
			
			rigidbody.AddForce(velocityChange, ForceMode.VelocityChange);
		}
	}
//	else if (!grounded) {
//		// Apply a force that attempts to accelerate in the desired direction
//		rigidbody.AddForce(targetVelocity * airControlFactor, ForceMode.Acceleration);
//	}
	else if (skiing && grounded) {
		// Amplify skiing speed slightly when we start out
		if (rigidbody.velocity.magnitude < skiingBoostBelowVelocity) {
			rigidbody.AddForce(rigidbody.velocity * skiingBoostPercent, ForceMode.Impulse);
		}
		
		// TODO change our PhysicMaterial instead
		rigidbody.AddForce(-rigidbody.velocity.normalized * skiingDampeningFactor, ForceMode.Impulse);
	}
	
	if (jetpacking) {
		//if (grounded) {
		//	rigidbody.velocity = Vector3(velocity.x, CalculateJumpVerticalSpeed(), velocity.z);
		//}
		//else {
		if (targetVelocity.magnitude == 0) {
			rigidbody.AddForce(Physics.gravity * -jumpHeight);
		}
		else {
			rigidbody.AddForce(Physics.gravity * (1 - fuelAirControlPenaltyFactor) * -jumpHeight);
			rigidbody.AddForce(targetVelocity * fuelAirControlFactor);
		}
		//}
	}
	else if (!grounded) {
		// free air control (takes no fuel)
		rigidbody.AddForce(targetVelocity * freeAirControlFactor);
	}

	// Jump
	//if (canJump && Input.GetButton("Jump"))
	//if (Input.GetMouseButton(1))
	//{
	//	rigidbody.velocity = Vector3(velocity.x, CalculateJumpVerticalSpeed(), velocity.z);
	//}
	//}
	//else {
	//	if (Input.GetMouseButton(1)) {
	//		rigidbody.AddForce(Physics.gravity * -10);
	//	}
	//}
 
	// We apply gravity manually for more tuning control
	rigidbody.AddForce(Vector3 (0, -gravity * rigidbody.mass, 0));
 
	grounded = false;
}
 
function OnCollisionStay ()
{
	//Debug.Log("ON COLLISION STAY");
	grounded = true;	
}
 
function CalculateJumpVerticalSpeed ()
{
	// From the jump height and gravity we deduce the upwards speed 
	// for the character to reach at the apex.
	return Mathf.Sqrt(2 * jumpHeight * gravity);
}

function AdjustGroundVelocityToNormal (hVelocity : Vector3, groundNormal : Vector3) : Vector3 {
	var sideways : Vector3 = Vector3.Cross(Vector3.up, hVelocity);
	return Vector3.Cross(sideways, groundNormal).normalized * hVelocity.magnitude;
}

