import torch
from diffusers import CogVideoXImageToVideoPipeline
from diffusers.utils import export_to_video, load_image

# check if cuda is available
print(torch.cuda.is_available())

if torch.cuda.is_available():
    print(torch.cuda.get_device_name())
    print(torch.cuda.current_device())
    print(torch.cuda.memory_allocated())
    print(torch.cuda.memory_reserved())
    print(torch.cuda.memory_summary())
else:
    print("No GPU available")


prompt = "Man moving his head around and smile eerily."
image = load_image(image="6204114589201842971.jpg")
pipe = CogVideoXImageToVideoPipeline.from_pretrained(
    "THUDM/CogVideoX-5b-I2V", torch_dtype=torch.bfloat16
)

# pipe.enable_sequential_cpu_offload()
pipe.vae.enable_tiling()
pipe.vae.enable_slicing()

video = pipe(
    prompt=prompt,
    image=image,
    num_videos_per_prompt=1,
    num_inference_steps=50,
    num_frames=24,
    guidance_scale=6,
    generator=torch.Generator(device="cuda").manual_seed(42),
).frames[0]

export_to_video(video, "output.mp4", fps=8)
