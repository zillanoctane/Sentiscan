from sqlalchemy import Column, Integer, String, Text, SmallInteger, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from ..database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    product_name = Column(String(255), index=True)
    brand = Column(String(80))
    review_text = Column(Text, nullable=False)
    rating = Column(SmallInteger)
    label = Column(Enum("positif", "negatif", name="review_label"), nullable=True, index=True)
    clean_text = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    dataset = relationship("Dataset", back_populates="reviews")
