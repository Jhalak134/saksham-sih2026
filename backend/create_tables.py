from backend.app.db.session import engine
from backend.app.db import models

models.Base.metadata.create_all(bind=engine)
print("Tables created successfully.")