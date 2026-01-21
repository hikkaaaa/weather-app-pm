import React from 'react';
import { Youtube, Play } from 'lucide-react';

const VideoSection = ({ videos }) => {
    if (!videos || videos.length === 0) return null;

    return (
        <div style={{ marginTop: '3rem' }}>
            <h3 style={{ marginBottom: '1.5rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Youtube color="#FF0000" size={32} /> Travel Guides
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {videos.map((video) => (
                    <div 
                        key={video.videoId} 
                        className="glass-card" 
                        style={{ padding: '0', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                    >
                        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                            <img 
                                src={video.thumbnail} 
                                alt={video.title} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{ 
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                                background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: '50px', height: '50px', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' 
                            }}>
                                <Play fill="white" color="white" size={24} style={{ marginLeft: '4px' }} />
                            </div>
                        </div>
                        <div style={{ padding: '1rem' }}>
                            <h4 style={{ margin: '0', fontSize: '1rem', lineHeight: '1.4', fontWeight: '500' }}>{video.title}</h4>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VideoSection;
