from insightface.app import FaceAnalysis

# Initialize model with CPU optimization
model = FaceAnalysis(
    name='buffalo_l',
    providers=['CPUExecutionProvider']
)
model.prepare(
    ctx_id=-1,  # -1 for CPU
    det_size=(320, 320),  # Smaller size for faster processing
    det_thresh=0.5 
)
