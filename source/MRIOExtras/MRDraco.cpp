#include "MRMesh/MRIOFormatsRegistry.h"
#include "MRMesh/MRPointCloud.h"
#include "MRMesh/MRPointsLoadSettings.h"
#include "MRMesh/MRMesh.h"
#include "MRMesh/MRMeshLoadSettings.h"
#include "MRMesh/MRStringConvert.h"
#include "MRMesh/MRTimer.h"

#include <draco/compression/decode.h>
#include <draco/core/decoder_buffer.h>
#include <draco/point_cloud/point_cloud.h>
#include <draco/mesh/mesh.h>

#include <fstream>

namespace MR
{

// ---------- Points (.drc) ----------
namespace PointsLoad
{
static Expected<PointCloud> fromDracoStream_( std::istream& in, const PointsLoadSettings& settings )
{
    MR_TIMER;
    (void)settings; // settings currently unused for Draco points
    in.seekg( 0, std::ios::end );
    const auto fileSize = in.tellg();
    in.seekg( 0, std::ios::beg );
    if ( fileSize <= 0 )
        return unexpected( "Empty Draco file" );

    std::vector<char> buffer( fileSize );
    if ( !in.read( buffer.data(), fileSize ) )
        return unexpected( "Failed to read Draco file" );

    draco::DecoderBuffer decoderBuffer;
    decoderBuffer.Init( buffer.data(), buffer.size() );

    draco::Decoder decoder;
    const auto geometryType = decoder.GetEncodedGeometryType( &decoderBuffer );
    if ( !geometryType.ok() )
        return unexpected( std::string( "Draco: cannot detect geometry type: " ) + geometryType.status().error_msg() );
    if ( geometryType.value() != draco::POINT_CLOUD )
        return unexpected( "Draco file does not contain a point cloud" );

    auto decodeResult = decoder.DecodePointCloudFromBuffer( &decoderBuffer );
    if ( !decodeResult.ok() )
        return unexpected( std::string( "Failed to decode Draco point cloud: " ) + decodeResult.status().error_msg() );

    const auto& dpc = decodeResult.value();

    PointCloud cloud;
    const int numPoints = dpc->num_points();
    if ( numPoints <= 0 )
        return unexpected( "Draco point cloud is empty" );

    cloud.points.resize( numPoints );
    cloud.validPoints.resize( numPoints, true );

    const auto posAtt = dpc->GetNamedAttribute( draco::GeometryAttribute::POSITION );
    if ( !posAtt )
        return unexpected( "Draco point cloud has no POSITION attribute" );

    for ( int pi = 0; pi < numPoints; ++pi )
    {
        const draco::PointIndex i( pi );
        const auto mi = posAtt->mapped_index( i );
        Vector3f p;
        posAtt->GetValue( mi, &p.x );
        cloud.points[VertId( pi )] = p;
    }

    const auto normalAtt = dpc->GetNamedAttribute( draco::GeometryAttribute::NORMAL );
    if ( normalAtt )
    {
        cloud.normals.resize( numPoints );
        for ( int pi = 0; pi < numPoints; ++pi )
        {
            const draco::PointIndex i( pi );
            const auto mi = normalAtt->mapped_index( i );
            Vector3f n;
            normalAtt->GetValue( mi, &n.x );
            cloud.normals[VertId( pi )] = n;
        }
    }

    return cloud;
}

static Expected<PointCloud> fromDraco( const std::filesystem::path& file, const PointsLoadSettings& settings )
{
    std::ifstream in( file, std::ifstream::binary );
    if ( !in )
        return unexpected( std::string( "Cannot open file for reading " ) + utf8string( file ) );
    return addFileNameInError( fromDracoStream_( in, settings ), file );
}

static Expected<PointCloud> fromDraco( std::istream& in, const PointsLoadSettings& settings )
{
    return fromDracoStream_( in, settings );
}

MR_ADD_POINTS_LOADER( IOFilter( "Draco (.drc)", "*.drc" ), fromDraco )
} // namespace PointsLoad

// ---------- Mesh (.drc) ----------
namespace MeshLoad
{
static Expected<Mesh> fromDracoStream_( std::istream& in, const MeshLoadSettings& settings )
{
    MR_TIMER;
    (void)settings; // settings currently unused for Draco mesh
    in.seekg( 0, std::ios::end );
    const auto fileSize = in.tellg();
    in.seekg( 0, std::ios::beg );
    if ( fileSize <= 0 )
        return unexpected( "Empty Draco file" );

    std::vector<char> buffer( fileSize );
    if ( !in.read( buffer.data(), fileSize ) )
        return unexpected( "Failed to read Draco file" );

    draco::DecoderBuffer decoderBuffer;
    decoderBuffer.Init( buffer.data(), buffer.size() );

    draco::Decoder decoder;
    const auto geometryType = decoder.GetEncodedGeometryType( &decoderBuffer );
    if ( !geometryType.ok() )
        return unexpected( std::string( "Draco: cannot detect geometry type: " ) + geometryType.status().error_msg() );
    if ( geometryType.value() != draco::TRIANGULAR_MESH )
        return unexpected( "Draco file does not contain a triangular mesh" );

    auto decodeRes = decoder.DecodeMeshFromBuffer( &decoderBuffer );
    if ( !decodeRes.ok() )
        return unexpected( std::string( "Failed to decode Draco mesh: " ) + decodeRes.status().error_msg() );

    const auto& dmesh = decodeRes.value();
    const int numPoints = dmesh->num_points();
    const int numFaces  = dmesh->num_faces();
    if ( numPoints <= 0 || numFaces <= 0 )
        return unexpected( "Draco mesh is empty" );

    VertCoords verts;
    verts.resize( numPoints );
    const auto posAtt = dmesh->GetNamedAttribute( draco::GeometryAttribute::POSITION );
    if ( !posAtt )
        return unexpected( "Draco mesh has no POSITION attribute" );
    for ( int pi = 0; pi < numPoints; ++pi )
    {
        const draco::PointIndex i( pi );
        const auto mi = posAtt->mapped_index( i );
        Vector3f p;
        posAtt->GetValue( mi, &p.x );
        verts[VertId( pi )] = p;
    }

    Triangulation tris;
    tris.reserve( numFaces );
    for ( draco::FaceIndex f( 0 ); f < numFaces; ++f )
    {
        const auto& face = dmesh->face( f );
        tris.push_back( { VertId( face[0].value() ), VertId( face[1].value() ), VertId( face[2].value() ) } );
    }

    auto mesh = Mesh::fromTriangles( std::move( verts ), tris, {}, settings.callback );
    return mesh;
}

static Expected<Mesh> fromDraco( const std::filesystem::path& file, const MeshLoadSettings& settings )
{
    std::ifstream in( file, std::ifstream::binary );
    if ( !in )
        return unexpected( std::string( "Cannot open file for reading " ) + utf8string( file ) );
    return addFileNameInError( fromDracoStream_( in, settings ), file );
}

static Expected<Mesh> fromDraco( std::istream& in, const MeshLoadSettings& settings )
{
    return fromDracoStream_( in, settings );
}

MR_ADD_MESH_LOADER( IOFilter( "Draco (.drc)", "*.drc" ), fromDraco )
} // namespace MeshLoad

} // namespace MR


